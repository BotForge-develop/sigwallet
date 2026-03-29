# SigWallet macOS Tahoe 26 – Komplette Schritt-für-Schritt Anleitung

## Voraussetzungen

- **macOS 26 Tahoe Beta** installiert (für Liquid Glass)
- **Xcode 26 Beta** installiert
- **Apple Developer Account** (kostenlos reicht für lokales Testen)
- Dein SigWallet iOS Projekt bereits in Xcode geöffnet gehabt

---

## Teil 1: Capacitor Sync (Web → iOS aktualisieren)

### Schritt 1.1: Web-App bauen
Öffne **PowerShell** auf deinem Windows PC:
```powershell
cd C:\sigwallet          # oder wo dein Projekt liegt
npm run build
```

### Schritt 1.2: iOS-Dateien synchronisieren
```powershell
npx cap sync ios
```
Dies kopiert den neuesten Web-Build nach `ios/App/App/public/`.

### Schritt 1.3: Post-Sync Script ausführen
Auf deinem **Mac** (im Terminal):
```bash
cd /pfad/zu/sigwallet
chmod +x ios-native/post-sync.sh
./ios-native/post-sync.sh
```
Dies ersetzt AppDelegate.swift, Info.plist und entfernt SceneDelegate.

### Schritt 1.4: iOS App testen
1. Öffne `ios/App/App.xcodeproj` in Xcode
2. Wähle dein iPhone als Zielgerät
3. `Cmd + R` zum Starten
4. Prüfe ob 3D-Karte, Transaktionen etc. funktionieren

---

## Teil 2: macOS Target zum Projekt hinzufügen

### Schritt 2.1: Xcode Projekt öffnen
1. Öffne `ios/App/App.xcodeproj` in Xcode 26

### Schritt 2.2: Neues macOS Target erstellen
1. Klicke auf das **blaue Projekt-Icon** ganz oben in der linken Sidebar
2. Klicke unten links auf das **"+"** Symbol (unter der Target-Liste)
3. Wähle **"macOS"** → **"App"**
4. Konfiguriere:
   - **Product Name:** `SigWalletMac`
   - **Team:** Dein Apple Developer Team
   - **Organization Identifier:** `com.sigwallet`
   - **Bundle Identifier:** `com.sigwallet.mac`
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** None
5. Klicke **"Finish"**

### Schritt 2.3: Auto-generierte Dateien löschen
Xcode erstellt automatisch Dateien. Lösche diese im **Project Navigator**:
1. Rechtsklick auf `SigWalletMac` Ordner → jede Datei einzeln:
   - `SigWalletMacApp.swift` → Rechtsklick → **"Delete"** → **"Move to Trash"**
   - `ContentView.swift` → Rechtsklick → **"Delete"** → **"Move to Trash"**
   - `Assets.xcassets` → **BEHALTEN** (brauchst du für App-Icon)

### Schritt 2.4: Unsere macOS-Dateien hinzufügen
1. Rechtsklick auf den `SigWalletMac` Ordner im Project Navigator
2. Wähle **"Add Files to 'App'..."**
3. Navigiere zu `macos-native/SigWalletMac/`
4. Wähle ALLE Dateien aus:
   - `SigWalletMacApp.swift`
   - `AppDelegate.swift`
   - `ContentView.swift`
   - `Info.plist`
   - `SigWalletMac.entitlements`
5. Stelle sicher:
   - ☑ **Copy items if needed**
   - ☑ Target: **SigWalletMac** (nur dieses angehakt!)
6. Klicke **"Add"**

### Schritt 2.5: Target-Einstellungen konfigurieren

#### General Tab:
1. Klicke auf das **blaue Projekt** → wähle Target **"SigWalletMac"**
2. **Minimum Deployments:** `macOS 26.0`
3. **App Category:** Finance

#### Signing & Capabilities:
1. **Team:** Dein Apple Developer Account
2. **Bundle Identifier:** `com.sigwallet.mac`
3. ☑ **Automatically manage signing**

#### Build Settings:
1. Suche nach `Info.plist` in der Suchleiste
2. Setze **Info.plist File** auf: `SigWalletMac/Info.plist`
3. Suche nach `Code Signing Entitlements`
4. Setze auf: `SigWalletMac/SigWalletMac.entitlements`

---

## Teil 3: Build & Run

### Schritt 3.1: Schema auswählen
1. Oben in der Xcode Toolbar siehst du das **Schema-Dropdown** (neben ▶ Play)
2. Klicke darauf → wähle **"SigWalletMac"**
3. Als Zielgerät wähle **"My Mac"**

### Schritt 3.2: Bauen und Starten
1. Drücke **`Cmd + R`**
2. Xcode kompiliert die macOS App
3. Ein Fenster öffnet sich mit:
   - **Liquid Glass Titelleiste** (automatisch auf macOS Tahoe)
   - **Loading Spinner** mit "SigWallet"
   - **QR-Code** mit blauem Faser-Kreis Animation

### Schritt 3.3: Mögliche Build-Fehler beheben

**Fehler: "No such module 'WebKit'"**
→ Kein Fix nötig, WebKit ist auf macOS immer verfügbar. Clean Build: `Shift + Cmd + K`, dann `Cmd + R`

**Fehler: "Signing requires a development team"**
→ Xcode → Target SigWalletMac → Signing & Capabilities → Team auswählen

**Fehler: "The sandbox is not in sync with the Podfile.lock"**
→ Ignorieren – der macOS Target nutzt keine Pods

---

## Teil 4: Mit iPhone verbinden (QR-Pairing)

### Schritt 4.1: macOS App starten
1. Die macOS App zeigt den **Desktop Login** Screen
2. Ein **QR-Code** wird angezeigt mit dem blauen Faser-Kreis

### Schritt 4.2: Auf dem iPhone scannen
1. Öffne die **SigWallet iOS App** auf deinem iPhone
2. Gehe zu **Profil** → **Gerät verbinden** (oder scanne den QR-Code mit der Kamera)
3. Die URL im QR-Code öffnet: `sigwallet.lovable.app/pair?token=XXXXX`
4. Bestätige die Verbindung auf dem iPhone

### Schritt 4.3: Desktop wird freigeschaltet
1. Der QR-Code verschwindet
2. Die macOS App navigiert automatisch zum **Dashboard**
3. Du bist eingeloggt – ohne Passwort eingeben!

---

## Teil 5: App exportieren (.app Datei)

### Schritt 5.1: Archive erstellen
1. Schema: **SigWalletMac** + **"Any Mac"**
2. **Product** → **Archive** (`Cmd + Shift + Archive` gibt es nicht, nutze das Menü)
3. Warte bis der Build fertig ist

### Schritt 5.2: Exportieren
1. Im **Organizer** Fenster (öffnet sich automatisch)
2. Wähle das neue Archive
3. Klicke **"Distribute App"**
4. Wähle **"Copy App"** (für lokale .app Datei)
5. Speichere die `SigWalletMac.app`

### Schritt 5.3: Testen
1. Öffne die exportierte `.app` Datei
2. Falls macOS warnt: **Systemeinstellungen → Datenschutz → Trotzdem öffnen**

---

## Teil 6: Beide Targets gleichzeitig verwalten

### iOS und macOS in einem Projekt:
```
ios/App/App.xcodeproj
├── App (iOS Target)          ← Capacitor + Native Tab Bar
│   ├── AppDelegate.swift     ← aus ios-native/
│   ├── Info.plist            ← aus ios-native/
│   └── public/               ← Web-Build von Capacitor
│
└── SigWalletMac (macOS Target) ← Reines SwiftUI + WKWebView
    ├── SigWalletMacApp.swift
    ├── AppDelegate.swift
    ├── ContentView.swift
    ├── Info.plist
    └── SigWalletMac.entitlements
```

### Web-App updaten:
```powershell
# Auf Windows:
cd C:\sigwallet
npm run build
npx cap sync ios

# Auf Mac:
./ios-native/post-sync.sh
```
Dann in Xcode `Cmd + R` für iOS oder macOS.

### Wichtig:
- Die **iOS App** nutzt Capacitor und lädt die Web-App lokal
- Die **macOS App** lädt die Web-App von `sigwallet.lovable.app` (online)
- Beide nutzen das gleiche Supabase-Backend und QR-Pairing System

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| macOS App zeigt weiße Seite | Prüfe Internetverbindung – die macOS App lädt die Web-App online |
| QR-Code wird nicht angezeigt | Prüfe ob `sigwallet.lovable.app` erreichbar ist |
| Liquid Glass fehlt | Stelle sicher dass macOS 26 Tahoe Beta läuft |
| Build schlägt fehl | Clean Build: `Shift + Cmd + K`, dann `Cmd + R` |
| Signing-Fehler | Team in Signing & Capabilities auswählen |
| "App is damaged" beim Öffnen | `xattr -cr /path/to/SigWalletMac.app` im Terminal |
