# SigWallet macOS – Xcode Setup Anleitung

## Option A: Zum bestehenden iOS-Projekt hinzufügen (Empfohlen)

1. **Xcode öffnen** → Dein bestehendes `App.xcodeproj` öffnen (in `/ios/App/`)

2. **macOS Target hinzufügen:**
   - Klick auf das Projekt (blau) in der linken Sidebar
   - Unten links auf **"+"** klicken → **"macOS" → "App"**
   - Product Name: `SigWalletMac`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Bundle Identifier: `com.sigwallet.mac`

3. **Dateien ersetzen:**
   - Lösche die automatisch erstellten Dateien im neuen Target
   - Ziehe alle Dateien aus `macos-native/SigWalletMac/` in das Target:
     - `SigWalletMacApp.swift`
     - `AppDelegate.swift`
     - `ContentView.swift`
     - `Info.plist`
     - `SigWalletMac.entitlements`

4. **Target konfigurieren:**
   - Deployment Target: **macOS 15.0** (oder **26.0** für Liquid Glass)
   - Signing: Dein Apple Developer Team auswählen
   - Info.plist File: auf `SigWalletMac/Info.plist` setzen
   - Entitlements: auf `SigWalletMac/SigWalletMac.entitlements` setzen

5. **Build & Run:**
   - Oben in Xcode das **SigWalletMac** Schema auswählen
   - `Cmd + R` zum Starten

---

## Option B: Eigenes macOS Projekt

1. **Xcode** → File → New → Project → **macOS → App**
2. Product Name: `SigWalletMac`
3. Interface: **SwiftUI**, Language: **Swift**
4. Lösche die Standard-Dateien und ersetze sie mit den Dateien aus diesem Ordner
5. Konfiguriere wie oben beschrieben

---

## Features

- **Liquid Glass Titelleiste** (automatisch auf macOS Tahoe 26)
- **WKWebView** lädt `sigwallet.lovable.app/desktop-login`
- **QR-Code Pairing** – Login über iPhone scannen
- **Transparenter Hintergrund** – Glass-Effekt scheint durch
- **Bottom-Nav versteckt** – Web-Navigation wird per CSS ausgeblendet
- **Route-Sync** – Native App weiß welche Seite geladen ist

---

## Mindest-Anforderungen

- Xcode 26 Beta (für Liquid Glass)
- macOS 26 Tahoe Beta
- Apple Developer Account (für Signing)
