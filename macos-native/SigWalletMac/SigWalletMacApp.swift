import SwiftUI

@main
struct SigWalletMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 420, minHeight: 720)
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 420, height: 820)
    }
}
