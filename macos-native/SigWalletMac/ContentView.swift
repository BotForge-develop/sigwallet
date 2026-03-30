import SwiftUI
import WebKit

struct ContentView: View {
    @State private var isLoading = true
    @State private var loadError: String? = nil

    var body: some View {
        ZStack {
            if #available(macOS 26.0, *) {
                Color.clear
                    .background(.ultraThinMaterial)
                    .ignoresSafeArea()
            } else {
                Color.black.ignoresSafeArea()
            }

            SigWalletWebView(isLoading: $isLoading, loadError: $loadError)
                .ignoresSafeArea()
                .opacity(isLoading ? 0 : 1)

            if isLoading {
                LoadingView(error: loadError) {
                    loadError = nil
                    isLoading = true
                    // Force reload by toggling — the WebView's updateNSView will re-trigger
                    NotificationCenter.default.post(name: .init("SigWalletReload"), object: nil)
                }
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: isLoading)
        .onAppear {
            // Safety: force hide loading after 10 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) {
                if isLoading && loadError == nil { isLoading = false }
            }
        }
    }
}

// MARK: - Loading View

struct LoadingView: View {
    @State private var rotation: Double = 0
    let error: String?
    let onRetry: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.9)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                if let error = error {
                    Text("Verbindungsfehler")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(.white.opacity(0.7))
                    Text(error)
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.4))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                    Button("Erneut versuchen") { onRetry() }
                        .buttonStyle(.bordered)
                        .tint(Color(hue: 0.17, saturation: 0.3, brightness: 0.91))
                } else {
                    Circle()
                        .trim(from: 0, to: 0.7)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(hue: 0.17, saturation: 0.3, brightness: 0.91),
                                    Color(hue: 0.17, saturation: 0.3, brightness: 0.91).opacity(0.2)
                                ],
                                startPoint: .topLeading, endPoint: .bottomTrailing
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
}

// MARK: - WebView

struct SigWalletWebView: NSViewRepresentable {
    @Binding var isLoading: Bool
    @Binding var loadError: String?

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
            setTimeout(notifyReady, 200);
          } else {
            document.addEventListener('DOMContentLoaded', function() { setTimeout(notifyReady, 200); }, { once: true });
          }
          window.addEventListener('load', function() { setTimeout(notifyReady, 300); }, { once: true });

          // Final fallback
          setTimeout(notifyReady, 3000);
        })();
        """
        let userScript = WKUserScript(source: bootstrapScript, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        config.userContentController.addUserScript(userScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.setValue(false, forKey: "drawsBackground")
        webView.allowsBackForwardNavigationGestures = true

        // Listen for reload notifications
        context.coordinator.webViewRef = webView
        NotificationCenter.default.addObserver(
            context.coordinator,
            selector: #selector(Coordinator.handleReload),
            name: .init("SigWalletReload"),
            object: nil
        )

        // Clear cache on every launch for latest version
        WKWebsiteDataStore.default().removeData(
            ofTypes: [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache],
            modifiedSince: Date.distantPast
        ) {
            if let url = URL(string: "https://sigwallet.lovable.app/desktop-login") {
                var request = URLRequest(url: url)
                request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
                request.timeoutInterval = 15
                webView.load(request)
            }
        }

        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    // MARK: - Coordinator

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: SigWalletWebView
        weak var webViewRef: WKWebView?

        init(_ parent: SigWalletWebView) {
            self.parent = parent
        }

        @objc func handleReload() {
            guard let webView = webViewRef,
                  let url = URL(string: "https://sigwallet.lovable.app/desktop-login") else { return }
            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
            request.timeoutInterval = 15
            webView.load(request)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                self.parent.isLoading = false
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.loadError = error.localizedDescription
                self.parent.isLoading = true
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.loadError = error.localizedDescription
                self.parent.isLoading = true
            }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "routeChange", let route = message.body as? String {
                print("[macOS] Route: \(route)")
            }
            if message.name == "pageReady" {
                DispatchQueue.main.async {
                    self.parent.isLoading = false
                }
            }
        }
    }
}

#Preview {
    ContentView()
        .frame(width: 420, height: 820)
}
