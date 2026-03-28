

## Diagnosis: Why Liquid Glass and Face ID Still Don't Work

After deep research, I found the **real root causes** that we've been missing:

### Problem 1: Liquid Glass Tab Bar

**Liquid Glass only appears when ALL of these are true:**
1. Built with **Xcode 26** (you have this)
2. **iOS Deployment Target** set to **26.0** in Xcode Build Settings
3. **No** `UIDesignRequiresCompatibility` key in Info.plist
4. **No** `UIApplicationSceneManifest` in Info.plist (if present, SceneDelegate takes over and ignores your AppDelegate's programmatic UITabBarController)
5. **No** `SceneDelegate.swift` file in the project

**The critical issue**: When you run `npx cap sync ios` or `npx cap add ios`, Capacitor **regenerates** `SceneDelegate.swift` and adds `UIApplicationSceneManifest` back to the Xcode-managed Info.plist. Even if you deleted them before, they come back after every sync. This means your programmatic `UITabBarController` in `AppDelegate` is never used as the root — the SceneDelegate overrides it.

### Problem 2: Face ID

The plugin `@aparajita/capacitor-biometric-auth` is now in `package.json`, but it needs to be **linked into the Xcode project** via Swift Package Manager. Running `npx cap sync ios` should auto-link it, but only if the ios platform was created with SPM support.

---

## Plan

### Step 1: Update AppDelegate.swift

The current code already looks correct. One small but important change: on iOS 26, do NOT set `tintColor` or `unselectedItemTintColor` on the tab bar before it's shown — these can interfere with the Liquid Glass material. Move tint settings inside the `#available` branch for pre-iOS-26 only.

### Step 2: Provide a post-sync fixup script

Since Capacitor regenerates SceneDelegate on every sync, I'll create a shell script the user runs **after every `npx cap sync ios`** that:
- Deletes `ios/App/App/SceneDelegate.swift`
- Removes `UIApplicationSceneManifest` from the Xcode Info.plist
- Removes `UIMainStoryboardFile` from the Xcode Info.plist  
- Sets the deployment target to 26.0

### Step 3: Provide complete step-by-step rebuild instructions

A clear numbered list:
1. `rm -rf ios/`
2. `npm install && npm run build`
3. `npx cap add ios --packagemanager SPM`  (SPM is needed for the biometric plugin)
4. `npx cap sync ios`
5. Run the fixup script (removes SceneDelegate, scene manifest)
6. Copy `ios-native/AppDelegate.swift` → `ios/App/App/AppDelegate.swift`
7. Copy `ios-native/Info.plist` → `ios/App/App/Info.plist`
8. Open Xcode, set deployment target to 26.0
9. Clean Build (⇧⌘K), then Run

### Files to create/update
- `ios-native/AppDelegate.swift` — remove tint color overrides for iOS 26+
- `ios-native/post-sync.sh` — new script to fix Capacitor's auto-generated files after every sync
- `ios-native/Info.plist` — already correct, no changes needed

### Technical Details

**Why SceneDelegate breaks everything:**
In iOS 13+, if `UIApplicationSceneManifest` exists in Info.plist, iOS ignores the `window` property in `AppDelegate.didFinishLaunchingWithOptions`. The `SceneDelegate.scene(_:willConnectTo:)` method creates its own window and root view controller. Your programmatic `UITabBarController` never gets used.

**Why Capacitor keeps regenerating it:**
`npx cap sync` copies template files including SceneDelegate. This is by design in Capacitor's iOS template. The only reliable fix is to delete it after every sync.

**Why SPM matters for Face ID:**
`@aparajita/capacitor-biometric-auth` distributes as a Swift Package. If the iOS platform was created with CocoaPods (the default without `--packagemanager SPM`), the plugin won't be linked. SPM is the recommended approach for Capacitor 8.

