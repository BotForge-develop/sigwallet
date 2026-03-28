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

        let tabs: [(String, String)] = [
            ("Home", "house.fill"),
            ("Transfer", "arrow.left.arrow.right"),
            ("Chat", "message.fill"),
            ("Profile", "person.fill")
        ]

        var controllers: [UIViewController] = []
        for (index, tab) in tabs.enumerated() {
            let vc = UIViewController()
            vc.view.backgroundColor = .clear
            vc.tabBarItem = UITabBarItem(title: tab.0, image: UIImage(systemName: tab.1), tag: index)
            controllers.append(vc)
        }

        tabBarController.viewControllers = controllers
        tabBarController.delegate = self

        // WICHTIG: Auf iOS 26+ KEINE Appearance setzen — Liquid Glass ist automatisch!
        // Nur auf älteren iOS-Versionen ein custom Appearance verwenden.
        if #available(iOS 26.0, *) {
            // Nichts tun — Liquid Glass wird automatisch angewendet
        } else {
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
            appearance.backgroundColor = UIColor.clear
            appearance.shadowColor = UIColor.clear
            tabBarController.tabBar.standardAppearance = appearance
            tabBarController.tabBar.scrollEdgeAppearance = appearance
        }

        tabBarController.tabBar.tintColor = UIColor(red: 0.93, green: 0.91, blue: 0.78, alpha: 1.0)
        tabBarController.tabBar.unselectedItemTintColor = UIColor.secondaryLabel
        tabBarController.tabBar.isHidden = true

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = tabBarController
        window?.makeKeyAndVisible()

        tabBarController.addChild(bridgeVC)
        bridgeVC.view.frame = tabBarController.view.bounds
        bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        tabBarController.view.insertSubview(bridgeVC.view, belowSubview: tabBarController.tabBar)
        bridgeVC.didMove(toParent: tabBarController)

        waitForBridgeAndSetupRouting()

        return true
    }

    // MARK: - Route Sync (NUR über JavaScript — NICHT über webView.url!)

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

          // Initial report nach kurzer Verzögerung (warten bis React Router geladen)
          setTimeout(reportRoute, 300);
          setTimeout(reportRoute, 1000);
          setTimeout(reportRoute, 2000);
        })();
        """

        let userScript = WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        webView.configuration.userContentController.addUserScript(userScript)
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    // MARK: - Route anwenden

    private func applyRoute(_ route: String) {
        let normalizedRoute = route.isEmpty ? "/" : route

        // Nur updaten wenn sich die Route tatsächlich geändert hat
        guard normalizedRoute != lastKnownRoute else { return }
        lastKnownRoute = normalizedRoute

        let isAuth = normalizedRoute == "/auth" || normalizedRoute.hasPrefix("/auth")

        UIView.animate(withDuration: 0.25) {
            self.updateLayout(tabBarHidden: isAuth)
        }

        guard !isAuth else { return }

        let tabRoutes = ["/", "/transfer", "/chat", "/profile"]
        for (index, tabRoute) in tabRoutes.enumerated() {
            if tabRoute == "/" && normalizedRoute == "/" {
                tabBarController.selectedIndex = index
                return
            }
            if tabRoute != "/" && normalizedRoute.hasPrefix(tabRoute) {
                tabBarController.selectedIndex = index
                return
            }
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
        // Route nochmal abfragen wenn App wieder aktiv wird
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
        let routes = ["/", "/transfer", "/chat", "/profile"]
        let index = viewController.tabBarItem.tag
        let route = routes[index]

        bridgeVC.bridge?.webView?.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('nativeTabChange', { detail: '\(route)' }));
        """, completionHandler: nil)

        tabBarController.selectedIndex = index
        lastKnownRoute = route
        return false
    }
}

// MARK: - JS Message Handler (einzige Route-Quelle!)

extension AppDelegate: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "routeChange", let route = message.body as? String else { return }

        DispatchQueue.main.async { [weak self] in
            self?.applyRoute(route)
        }
    }
}
