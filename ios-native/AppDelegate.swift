import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var tabBarController: UITabBarController!
    var bridgeVC: CAPBridgeViewController!

    private var routeObserverSetup = false
    private var lastKnownRoute = "/auth"

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        bridgeVC = CAPBridgeViewController()
        tabBarController = UITabBarController()

        // Use the LiquidGlassTabBar setup (iOS 26 UITab API + fallback)
        LiquidGlassTabBarSetup.configure(tabBarController: tabBarController)

        tabBarController.delegate = self
        tabBarController.tabBar.isHidden = true // Hidden until user logs in

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = tabBarController
        window?.makeKeyAndVisible()

        // Add Capacitor WebView below the tab bar
        tabBarController.addChild(bridgeVC)
        bridgeVC.view.frame = tabBarController.view.bounds
        bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        tabBarController.view.insertSubview(bridgeVC.view, belowSubview: tabBarController.tabBar)
        bridgeVC.didMove(toParent: tabBarController)

        waitForBridgeAndSetupRouting()

        return true
    }

    // MARK: - Route Sync

    private func waitForBridgeAndSetupRouting() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self = self else { return }
            guard let webView = self.bridgeVC.bridge?.webView else {
                self.waitForBridgeAndSetupRouting()
                return
            }
            self.setupRouteObserver(webView: webView)
        }
    }

    private func setupRouteObserver(webView: WKWebView) {
        guard !routeObserverSetup else { return }
        routeObserverSetup = true

        webView.configuration.userContentController.removeScriptMessageHandler(forName: "routeChange")
        webView.configuration.userContentController.add(self, name: "routeChange")

        let script = """
        (function() {
          if (window.__nativeRouteSyncInstalled) return;
          window.__nativeRouteSyncInstalled = true;

          function reportRoute() {
            try {
              window.webkit.messageHandlers.routeChange.postMessage(window.location.pathname || "/");
            } catch (e) {}
          }

          const origPushState = history.pushState;
          history.pushState = function() {
            origPushState.apply(this, arguments);
            setTimeout(reportRoute, 50);
          };

          const origReplaceState = history.replaceState;
          history.replaceState = function() {
            origReplaceState.apply(this, arguments);
            setTimeout(reportRoute, 50);
          };

          window.addEventListener("popstate", reportRoute);
          window.addEventListener("nativeRouteRefresh", reportRoute);

          setTimeout(reportRoute, 300);
          setTimeout(reportRoute, 1000);
          setTimeout(reportRoute, 2000);
        })();
        """

        let userScript = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        webView.configuration.userContentController.addUserScript(userScript)
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    // MARK: - Route Apply

    private func applyRoute(_ route: String) {
        let normalizedRoute = route.isEmpty ? "/" : route

        guard normalizedRoute != lastKnownRoute else { return }
        lastKnownRoute = normalizedRoute

        let isAuth = normalizedRoute == "/auth" || normalizedRoute.hasPrefix("/auth")

        UIView.animate(withDuration: 0.25) {
            self.updateLayout(tabBarHidden: isAuth)
        }

        guard !isAuth else { return }

        if let index = LiquidGlassTabBarSetup.tabIndex(for: normalizedRoute) {
            tabBarController.selectedIndex = index
        }
    }

    private func updateLayout(tabBarHidden: Bool) {
        tabBarController.tabBar.isHidden = tabBarHidden

        guard let webView = bridgeVC.bridge?.webView else { return }

        let bottomInset: CGFloat = tabBarHidden ? 0 : tabBarController.tabBar.frame.height
        webView.scrollView.contentInset.bottom = bottomInset
        webView.scrollView.verticalScrollIndicatorInsets.bottom = bottomInset
    }

    // MARK: - App Lifecycle

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        bridgeVC.bridge?.webView?.evaluateJavaScript(
            "window.dispatchEvent(new Event('nativeRouteRefresh'));",
            completionHandler: nil
        )
    }

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}

// MARK: - Tab Bar Delegate

extension AppDelegate: UITabBarControllerDelegate {
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        let index = viewController.tabBarItem.tag
        let route = LiquidGlassTabBarSetup.route(for: index)

        bridgeVC.bridge?.webView?.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('nativeTabChange', { detail: '\(route)' }));
        """, completionHandler: nil)

        tabBarController.selectedIndex = index
        lastKnownRoute = route
        return false
    }
}

// MARK: - JS Message Handler

extension AppDelegate: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "routeChange", let route = message.body as? String else { return }

        DispatchQueue.main.async { [weak self] in
            self?.applyRoute(route)
        }
    }
}
