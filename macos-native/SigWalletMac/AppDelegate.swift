import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Make the window use the native Liquid Glass material on macOS Tahoe 26
        if let window = NSApplication.shared.windows.first {
            window.titlebarAppearsTransparent = true
            window.titleVisibility = .hidden
            window.isMovableByWindowBackground = true
            window.backgroundColor = .clear

            // Enable full-size content view for edge-to-edge glass
            window.styleMask.insert(.fullSizeContentView)

            // On macOS 26 (Tahoe), the system automatically applies
            // Liquid Glass to the toolbar area. We just need to ensure
            // the window is configured correctly.
            if #available(macOS 26.0, *) {
                // Liquid Glass is automatic with .fullSizeContentView
                // The toolbar/titlebar gets the glass material natively
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
