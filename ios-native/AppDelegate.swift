import UIKit
import Capacitor
import WebKit

// MARK: - Liquid Glass Tab Bar Setup

struct LiquidGlassTabBarSetup {

    struct TabDef {
        let title: String
        let systemImage: String
        let route: String
    }

    static let tabs: [TabDef] = [
        TabDef(title: "Home", systemImage: "house.fill", route: "/"),
        TabDef(title: "Transfer", systemImage: "arrow.left.arrow.right", route: "/transfer"),
        TabDef(title: "Chat", systemImage: "message.fill", route: "/chat"),
        TabDef(title: "Profile", systemImage: "person.fill", route: "/profile"),
    ]

    static func configure(tabBarController: UITabBarController) {
        var controllers: [UIViewController] = []

        for (index, tab) in tabs.enumerated() {
            let vc = UIViewController()
            vc.view.backgroundColor = .clear
            vc.tabBarItem = UITabBarItem(title: tab.title, image: UIImage(systemName: tab.systemImage), tag: index)
            controllers.append(vc)
        }

        tabBarController.viewControllers = controllers

        if #available(iOS 26.0, *) {
            // Use the new UITab API required for Liquid Glass
            var tabObjects: [UITab] = []
            for (index, tab) in tabs.enumerated() {
                let uiTab = UITab(
                    title: tab.title,
                    image: UIImage(systemName: tab.systemImage),
                    identifier: tab.route
                ) { _ in
                    controllers[index]
                }
                tabObjects.append(uiTab)
            }
            tabBarController.tabs = tabObjects
            // Do NOT set any appearance — Liquid Glass is automatic on iOS 26
        } else {
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
            appearance.backgroundColor = UIColor.clear
            appearance.shadowColor = UIColor.clear
            tabBarController.tabBar.standardAppearance = appearance
            tabBarController.tabBar.scrollEdgeAppearance = appearance
            tabBarController.tabBar.tintColor = UIColor(red: 0.93, green: 0.91, blue: 0.78, alpha: 1.0)
            tabBarController.tabBar.unselectedItemTintColor = UIColor.secondaryLabel
        }
    }

    static func route(for index: Int) -> String {
        guard index >= 0 && index < tabs.count else { return "/" }
        return tabs[index].route
    }

    static func tabIndex(for route: String) -> Int? {
        for (index, tab) in tabs.enumerated() {
            if tab.route == "/" && route == "/" { return index }
            if tab.route != "/" && route.hasPrefix(tab.route) { return index }
        }
        return nil
    }
}

// MARK: - App Delegate

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

        LiquidGlassTabBarSetup.configure(tabBarController: tabBarController)

        tabBarController.delegate = self
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
