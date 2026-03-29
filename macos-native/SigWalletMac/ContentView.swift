import SwiftUI
import WebKit

struct ContentView: View {
    @State private var isLoading = true

    var body: some View {
        ZStack {
            if #available(macOS 26.0, *) {
                Color.clear
                    .background(.ultraThinMaterial)
                    .ignoresSafeArea()
            } else {
                Color.black.ignoresSafeArea()
            }

            SigWalletWebView(isLoading: $isLoading)
                .ignoresSafeArea()

            if isLoading {
                LoadingView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: isLoading)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
                if isLoading {
                    isLoading = false
                }
            }
        }
    }
}

// MARK: - Loading View

struct LoadingView: View {
    @State private var rotation: Double = 0

    var body: some View {
        ZStack {
            Color.black.opacity(0.85)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                // Spinning ring
                Circle()
                    .trim(from: 0, to: 0.7)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color(hue: 0.17, saturation: 0.3, brightness: 0.91),
                                Color(hue: 0.17, saturation: 0.3, brightness: 0.91).opacity(0.2)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .frame(width: 40, height: 40)
                    .rotationEffect(.degrees(rotation))
                    .onAppear {
                        withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                            rotation = 360
                        }
                    }

                Text("SigWallet")
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .foregroundColor(Color(hue: 0.17, saturation: 0.3, brightness: 0.91))
            }
        }
    }
}

// MARK: - WebView

struct SigWalletWebView: NSViewRepresentable {
    @Binding var isLoading: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.websiteDataStore = .default()

        config.userContentController.add(context.coordinator, name: "routeChange")
        config.userContentController.add(context.coordinator, name: "pageReady")

        let bootstrapScript = """
        (function() {
          var style = document.createElement('style');
          style.textContent = `
            nav[class*="BottomNav"], [class*="bottom-nav"] { display: none !important; }
            html, body, #root { position: relative !important; overflow: auto !important; }
          `;
          document.head.appendChild(style);

          function notifyReady() {
            try { window.webkit.messageHandlers.pageReady.postMessage(window.location.pathname || '/'); } catch (e) {}
          }

          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(notifyReady, 150);
          } else {
            document.addEventListener('DOMContentLoaded', function() { setTimeout(notifyReady, 150); }, { once: true });
          }
          window.addEventListener('load', function() { setTimeout(notifyReady, 250); }, { once: true });
        })();
        """
        let userScript = WKUserScript(source: bootstrapScript, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        config.userContentController.addUserScript(userScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.setValue(false, forKey: "drawsBackground")
        webView.allowsBackForwardNavigationGestures = true

        if let url = URL(string: "https://sigwallet.lovable.app/desktop-login") {
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            request.timeoutInterval = 20
            webView.load(request)
        }

        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    // MARK: - Coordinator

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: SigWalletWebView

        init(_ parent: SigWalletWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Clear cache to ensure latest version loads
            WKWebsiteDataStore.default().removeData(
                ofTypes: [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache],
                modifiedSince: Date(timeIntervalSince1970: 0)
            ) {}
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.parent.isLoading = false
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "routeChange", let route = message.body as? String {
                print("[macOS] Route changed: \(route)")
            }
        }
    }
}

#Preview {
    ContentView()
        .frame(width: 420, height: 820)
}
