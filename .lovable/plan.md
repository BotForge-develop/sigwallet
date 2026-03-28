
Goal: get both native iOS features working reliably: Face ID and the native Apple-style tab bar.

What I found
- The web app side is already prepared for a native tab bar:
  - `src/components/BottomNav.tsx` hides the web tab bar on iOS.
  - `src/App.tsx` sends route changes to native via `window.webkit.messageHandlers.routeChange`.
- The current blocker is very likely in the local Xcode project, not in the Lovable preview.
- I also found a strong Face ID root cause: your app uses Capacitor 8, but the installed biometric package in `package.json` is `capacitor-native-biometric@4.2.2`, and its npm README says it only supports Capacitor 3 and 4. That makes it a likely reason why Face ID never appears on iOS.
- I could not inspect the native iOS files directly because there is no `ios/` folder in this repo snapshot, so the Liquid Glass issue is almost certainly inside your local Xcode project files.

Implementation plan

1. Fix the biometric dependency mismatch
- Replace `capacitor-native-biometric` with a Capacitor-8-compatible biometric plugin.
- Update `src/lib/biometrics.ts` imports and method calls to the new plugin API.
- Keep the current account-bound behavior:
  - save credentials per email
  - only offer Face ID for the same account
  - show the Face ID prompt right after successful manual login

2. Harden the auth flow for native iOS
- Keep the existing “manual login first, then ask to enable Face ID” pattern in `src/pages/Auth.tsx`.
- Add clearer failure handling so the app can distinguish:
  - plugin unavailable
  - permission missing
  - biometric enrollment missing
  - user canceled
- Ensure the login page only auto-attempts biometrics when credentials actually exist for that account.

3. Fix the native tab bar ownership in Xcode
- Ensure the native app lifecycle is fully controlled by `AppDelegate`.
- Remove any storyboard/scene-based startup that can override the programmatic `UITabBarController`.
- Verify the native bar is created as the real root view controller and not covered by another controller.
- Avoid aggressive custom `UITabBarAppearance` styling on newer iOS, because that can suppress the Apple glass effect.

4. Fix required iOS permissions/config
- Add `NSFaceIDUsageDescription` in `Info.plist`.
- Verify the biometric plugin is actually linked into the iOS app target.
- Check raw Info.plist keys, not just the friendly names in Xcode.

5. End-to-end native validation
- Test this exact sequence on a real iPhone:
  1. cold launch app
  2. sign in manually
  3. get “Enable Face ID?” prompt
  4. enable Face ID
  5. background/close app
  6. reopen app
  7. Face ID login appears
  8. native tab bar is visible after login and hidden on `/auth`

Exact files I would update
- `package.json`
- `src/lib/biometrics.ts`
- `src/pages/Auth.tsx`
- possibly `src/contexts/AuthContext.tsx` for better biometric unlock behavior
- local native iOS files in Xcode:
  - `ios/App/App/Info.plist`
  - `ios/App/App/AppDelegate.swift`
  - remove or neutralize `SceneDelegate.swift`
  - remove `Main.storyboard` startup usage

Technical details
- Evidence for Face ID root cause:
  - `package.json` shows Capacitor 8 packages
  - `package.json` also shows `capacitor-native-biometric@4.2.2`
  - npm docs for that package explicitly say “Only supports Capacitor 3 and 4”
- Evidence web side is ready:
  - `BottomNav.tsx` already hides the web bar on iOS
  - `App.tsx` already posts route changes to native
- Therefore:
  - Face ID failure is likely plugin compatibility + missing iOS permission/linking
  - Liquid Glass failure is likely local Xcode scene/storyboard/root-controller setup

Most likely final diagnosis
- Face ID is failing because the biometric plugin is outdated/incompatible with Capacitor 8.
- Liquid Glass is failing because the local iOS app is not actually booting through the custom native tab bar controller anymore, or its appearance is being overridden.

If you approve, my next implementation pass will focus on:
1. replacing the biometric plugin with a Capacitor-8-compatible one
2. adapting the auth code to it
3. giving you a precise Xcode-native checklist for the local files that must match the web code
