import UIKit

/// Sets up a UITabBarController with proper iOS 26 Liquid Glass support.
/// On iOS 26+, uses the new UITab API which is required for Liquid Glass.
/// On older iOS, falls back to UITabBarItem.
class LiquidGlassTabBarSetup {

    struct TabDefinition {
        let title: String
        let systemImage: String
        let route: String
    }

    static let tabs: [TabDefinition] = [
        TabDefinition(title: "Home", systemImage: "house.fill", route: "/"),
        TabDefinition(title: "Transfer", systemImage: "arrow.left.arrow.right", route: "/transfer"),
        TabDefinition(title: "Chat", systemImage: "message.fill", route: "/chat"),
        TabDefinition(title: "Profile", systemImage: "person.fill", route: "/profile"),
    ]

    static func configure(tabBarController: UITabBarController) {
        var controllers: [UIViewController] = []

        for (index, tab) in tabs.enumerated() {
            let vc = UIViewController()
            vc.view.backgroundColor = .clear
            vc.tabBarItem = UITabBarItem(
                title: tab.title,
                image: UIImage(systemName: tab.systemImage),
                tag: index
            )
            controllers.append(vc)
        }

        tabBarController.viewControllers = controllers

        // iOS 26+: Use the new UITab API for Liquid Glass
        if #available(iOS 26.0, *) {
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

            // Do NOT set any appearance properties — Liquid Glass is automatic
            // Do NOT set tintColor, backgroundColor, or UITabBarAppearance
        } else {
            // Pre-iOS 26: custom blur appearance
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

    /// Returns the route string for a given tab index
    static func route(for index: Int) -> String {
        guard index >= 0 && index < tabs.count else { return "/" }
        return tabs[index].route
    }

    /// Returns the tab index for a given route, or nil if not found
    static func tabIndex(for route: String) -> Int? {
        for (index, tab) in tabs.enumerated() {
            if tab.route == "/" && route == "/" {
                return index
            }
            if tab.route != "/" && route.hasPrefix(tab.route) {
                return index
            }
        }
        return nil
    }
}
