import UIKit
import Capacitor
import WebKit

class LiquidGlassSceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?
    var tabBarController: UITabBarController!
    var bridgeVC: CAPBridgeViewController!

    private var routeObserverSetup = false
    private var lastKnownRoute = "/auth"

    // Tab definitions
    private let tabs: [(title: String, image: String, route: String)] = [
        ("Home", "house.fill", "/"),
        ("Transfer", "arrow.left.arrow.right", "/transfer"),
        ("Chat", "message.fill", "/chat"),
        ("Profile", "person.fill", "/profile"),
    ]

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Get bridgeVC from AppDelegate
        guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
        bridgeVC = appDelegate.bridgeVC

        // Create tab bar controller
        tabBarController = UITabBarController()

        var controllers: [UIViewController] = []
        for (index, tab) in tabs.enumerated() {
            let vc = UIViewController()
            vc.view.backgroundColor = .clear
            vc.tabBarItem = UITabBarItem(title: tab.title, image: UIImage(systemName: tab.image), tag: index)
            controllers.append(vc)
        }

        tabBarController.viewControllers = controllers
        tabBarController.delegate = self

        // iOS 26+: Use UITab API for proper Liquid Glass rendering
        if #available(iOS 26.0, *) {
            var tabObjects: [UITab] = []
            for (index, tab) in tabs.enumerated() {
                let uiTab = UITab(
                    title: tab.title,
                    image: UIImage(systemName: tab.image),
                    identifier: tab.route
                ) { _ in
                    controllers[index]
                }
                tabObjects.append(uiTab)
            }
            tabBarController.tabs = tabObjects
            // Do NOT customize appearance — Liquid Glass is automatic
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

        tabBarController.tabBar.isHidden = true

        // IMPORTANT: Create window with windowScene (required for iOS 26 Liquid Glass)
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = tabBarController
        window?.makeKeyAndVisible()

        // Add Capacitor WebView below the tab bar
        tabBarController.addChild(bridgeVC)
        bridgeVC.view.frame = tabBarController.view.bounds
        bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        tabBarController.view.insertSubview(bridgeVC.view, belowSubview: tabBarController.tabBar)
        bridgeVC.didMove(toParent: tabBarController)

        waitForBridgeAndSetupRouting()
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

        for (index, tab) in tabs.enumerated() {
            if tab.route == "/" && normalizedRoute == "/" {
                tabBarController.selectedIndex = index
                return
            }
            if tab.route != "/" && normalizedRoute.hasPrefix(tab.route) {
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

    // MARK: - Scene Lifecycle

    func sceneDidBecomeActive(_ scene: UIScene) {
        bridgeVC.bridge?.webView?.evaluateJavaScript(
            "window.dispatchEvent(new Event('nativeRouteRefresh'));",
            completionHandler: nil
        )
    }

    func sceneWillResignActive(_ scene: UIScene) {}
    func sceneDidEnterBackground(_ scene: UIScene) {}
    func sceneWillEnterForeground(_ scene: UIScene) {}
}

// MARK: - Tab Bar Delegate

extension LiquidGlassSceneDelegate: UITabBarControllerDelegate {
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        let index = viewController.tabBarItem.tag
        guard index >= 0 && index < tabs.count else { return false }
        let route = tabs[index].route

        bridgeVC.bridge?.webView?.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('nativeTabChange', { detail: '\(route)' }));
        """, completionHandler: nil)

        tabBarController.selectedIndex = index
        lastKnownRoute = route
        return false
    }
}

// MARK: - JS Message Handler

extension LiquidGlassSceneDelegate: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "routeChange", let route = message.body as? String else { return }
        DispatchQueue.main.async { [weak self] in
            self?.applyRoute(route)
        }
    }
}
