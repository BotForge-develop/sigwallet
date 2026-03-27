

# Native iOS App (IPA) für SigWallet via Capacitor

## Übersicht
Wir wrappen deine bestehende SigWallet React-App in eine native iOS-App mit Capacitor. Du bekommst eine IPA-Datei, die du direkt auf dein iPhone laden kannst — ohne App Store. Dazu kommen Push Notifications und ein iOS-native Glaseffekt-Design.

**Wichtig zu wissen:** "Liquid Glass" ist ein iOS 26 (2025) UI-Kit Feature, das nur in nativem SwiftUI verfügbar ist. In einer Capacitor-App (= Web-View) können wir den Effekt visuell nachbauen mit CSS `backdrop-filter: blur()` + Glasmorphism — was optisch fast identisch aussieht. Echte native Liquid Glass APIs sind nur über reines Swift möglich.

---

## Was wird gemacht

### 1. Capacitor Setup
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` installieren
- `@capacitor/push-notifications` für Push Notifications
- `@capacitor/haptics` für haptisches Feedback
- `@capacitor/status-bar` für native StatusBar-Kontrolle
- `capacitor.config.ts` erstellen mit App-ID `app.lovable.b3eb565e41394a9ea27a48fe3bcb9762`, App-Name "SigWallet", und Live-Reload URL

### 2. iOS Liquid Glass Design (CSS)
- Globale CSS-Klassen für den Glaseffekt verbessern: stärkerer `backdrop-filter: blur(40px)` + subtile Farbverläufe die dem iOS 26 Liquid Glass nachempfunden sind
- Dunkelblau/Frosted-Effekte auf Karten, Modals und Navigation
- StatusBar-Integration (helle Schrift auf dunklem Hintergrund)

### 3. Push Notifications
- Capacitor Push Notifications Plugin einbinden
- Edge Function für Push-Benachrichtigungen bei neuen Transaktionen
- Device-Token in der Datenbank speichern (neue `push_tokens` Tabelle)
- Benachrichtigungen bei: eingehende Transaktionen, tägliche Balance-Zusammenfassung

### 4. Native iOS Anpassungen
- `SafeArea`-Handling für iPhone Notch/Dynamic Island
- Haptic Feedback bei Buttons und Aktionen
- Splash Screen Konfiguration

---

## Deine Schritte danach (auf deinem Mac)

1. Projekt auf GitHub exportieren → `git clone`
2. `npm install` → `npx cap add ios` → `npm run build` → `npx cap sync`
3. `npx cap open ios` → Xcode öffnet sich
4. In Xcode: Signing mit deinem Apple Account (Personal Team reicht für persönliche Nutzung)
5. iPhone anschließen → Build & Run → App ist auf deinem iPhone

Kein Developer Account ($99/Jahr) nötig für Personal Use — dein normaler Apple Account reicht. Die App läuft dann 7 Tage, danach musst du sie einmal neu builden.

---

## Technische Details

**Neue Dateien:**
- `capacitor.config.ts` — Capacitor Konfiguration
- `src/lib/pushNotifications.ts` — Push Notification Handler
- `src/lib/haptics.ts` — Haptic Feedback Utility
- Migration: `push_tokens` Tabelle (user_id, token, platform, created_at)
- Edge Function: `send-push-notification`

**Geänderte Dateien:**
- `package.json` — neue Dependencies
- `src/index.css` — erweiterte Liquid Glass Styles
- `src/components/BottomNav.tsx` — SafeArea + Haptics
- `src/App.tsx` — Push Notification Init + StatusBar
- `src/main.tsx` — Capacitor App Listener

**Neue Dependencies:**
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
- `@capacitor/push-notifications`, `@capacitor/haptics`, `@capacitor/status-bar`

