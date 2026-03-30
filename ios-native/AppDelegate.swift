import UIKit
import Capacitor
import WebKit
import WidgetKit
import UserNotifications

// Simple token holder for push notification forwarding
class NotificationsRouter {
    static let shared = NotificationsRouter()
    var apnsToken: Data?
}

/// This is a MINIMAL AppDelegate that lets Capacitor own its lifecycle,
/// then overlays a native UITabBar AFTER the bridge is ready.
/// No root VC replacement. No SceneDelegate fight. Just an overlay.
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // We keep a reference to the tab bar we overlay
    private var nativeTabBar: UITabBar?
    private var routeObserverSetup = false
    private var lastKnownRoute = "/auth"
    private var bridgeVC: CAPBridgeViewController?

    private let tabDefinitions: [(title: String, image: String, route: String)] = [
        ("Home", "house.fill", "/"),
        ("Transfer", "arrow.left.arrow.right", "/transfer"),
        ("Wallet", "wallet.bifold.fill", "/wallet"),
        ("Profil", "person.fill", "/profile"),
    ]

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // Register for push notifications
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            if granted {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
        }

        // Let Capacitor create its own bridge VC as root — DON'T FIGHT IT
        let vc = CAPBridgeViewController()
        self.bridgeVC = vc

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = vc
        window?.makeKeyAndVisible()

        // After a short delay, overlay native tab bar and setup route sync
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.setupNativeTabBar()
            self.waitForBridgeAndSetupRouting()
        }

        return true
    }

    // MARK: - Native Tab Bar Overlay

    private func setupNativeTabBar() {
        guard let rootView = bridgeVC?.view else { return }

        let tabBar = UITabBar()
        tabBar.delegate = self
        tabBar.translatesAutoresizingMaskIntoConstraints = false

        // Create tab bar items
        var items: [UITabBarItem] = []
        for (index, tab) in tabDefinitions.enumerated() {
            let item = UITabBarItem(
                title: tab.title,
                image: UIImage(systemName: tab.image),
                tag: index
            )
            items.append(item)
        }
        tabBar.items = items
        tabBar.selectedItem = items.first

        // iOS 26+: Do NOT customize appearance — Liquid Glass is automatic
        // iOS <26: Apply a translucent blur appearance
        if #available(iOS 26.0, *) {
            // Liquid Glass is automatic. Don't touch anything.
        } else {
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
            appearance.backgroundColor = UIColor.clear
            appearance.shadowColor = UIColor.clear
            tabBar.standardAppearance = appearance
            tabBar.scrollEdgeAppearance = appearance
            tabBar.tintColor = UIColor(red: 0.93, green: 0.91, blue: 0.78, alpha: 1.0)
            tabBar.unselectedItemTintColor = UIColor.secondaryLabel
        }

        // IMPORTANT: Keep translucent for Liquid Glass to work
        tabBar.isTranslucent = true

        // Start hidden (show after login)
        tabBar.isHidden = true

        rootView.addSubview(tabBar)

        // Pin to bottom with safe area
        NSLayoutConstraint.activate([
            tabBar.leadingAnchor.constraint(equalTo: rootView.leadingAnchor),
            tabBar.trailingAnchor.constraint(equalTo: rootView.trailingAnchor),
            tabBar.bottomAnchor.constraint(equalTo: rootView.bottomAnchor),
        ])

        self.nativeTabBar = tabBar
    }

    // MARK: - Route Sync

    private func waitForBridgeAndSetupRouting() {
        guard let webView = bridgeVC?.bridge?.webView else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.waitForBridgeAndSetupRouting()
            }
            return
        }
        setupRouteObserver(webView: webView)
    }

    private func setupRouteObserver(webView: WKWebView) {
        guard !routeObserverSetup else { return }
        routeObserverSetup = true

        webView.configuration.userContentController.removeScriptMessageHandler(forName: "routeChange")
        webView.configuration.userContentController.add(self, name: "routeChange")

        // Widget data handler
        webView.configuration.userContentController.add(self, name: "widgetData")

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
          setTimeout(reportRoute, 4000);
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
            self.nativeTabBar?.isHidden = isAuth
        }

        // Adjust WebView insets
        if let webView = bridgeVC?.bridge?.webView {
            let tabBarHeight = self.nativeTabBar?.frame.height ?? 0
            let bottomInset: CGFloat = isAuth ? 0 : tabBarHeight
            webView.scrollView.contentInset.bottom = bottomInset
            webView.scrollView.verticalScrollIndicatorInsets.bottom = bottomInset
        }

        guard !isAuth else { return }

        // Sync selected tab
        for (index, tab) in tabDefinitions.enumerated() {
            if tab.route == "/" && normalizedRoute == "/" {
                nativeTabBar?.selectedItem = nativeTabBar?.items?[index]
                return
            }
            if tab.route != "/" && normalizedRoute.hasPrefix(tab.route) {
                nativeTabBar?.selectedItem = nativeTabBar?.items?[index]
                return
            }
        }
    }

    // MARK: - App Lifecycle

    func applicationDidBecomeActive(_ application: UIApplication) {
        bridgeVC?.bridge?.webView?.evaluateJavaScript(
            "window.dispatchEvent(new Event('nativeRouteRefresh'));",
            completionHandler: nil
        )
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    // MARK: - Push Notifications

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Capacitor handles this via the PushNotifications plugin
        NotificationsRouter.shared.apnsToken = deviceToken
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("[Push] Failed to register: \(error.localizedDescription)")
    }

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

// MARK: - UITabBar Delegate

extension AppDelegate: UITabBarDelegate {
    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        let index = item.tag
        guard index >= 0 && index < tabDefinitions.count else { return }
        let route = tabDefinitions[index].route

        bridgeVC?.bridge?.webView?.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('nativeTabChange', { detail: '\(route)' }));
        """, completionHandler: nil)

        lastKnownRoute = route
    }
}

// MARK: - JS Message Handler

extension AppDelegate: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "routeChange", let route = message.body as? String {
            DispatchQueue.main.async { [weak self] in
                self?.applyRoute(route)
            }
        }

        // Handle widget data updates from web app
        if message.name == "widgetData", let data = message.body as? [String: String] {
            if let defaults = UserDefaults(suiteName: "group.app.lovable.sigwallet") {
                for (key, value) in data {
                    defaults.set(value, forKey: key)
                }
                // Trigger widget timeline refresh
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
        }
    }
}
