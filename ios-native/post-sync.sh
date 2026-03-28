#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_APP_DIR="$PROJECT_ROOT/ios/App/App"
NATIVE_DIR="$PROJECT_ROOT/ios-native"

echo "Post-sync fixup starting..."

# 1. Delete Capacitor's default SceneDelegate (we provide our own)
if [ -f "$IOS_APP_DIR/SceneDelegate.swift" ]; then
    rm "$IOS_APP_DIR/SceneDelegate.swift"
    echo "Deleted Capacitor SceneDelegate.swift"
fi

# 2. Remove UIMainStoryboardFile (we use programmatic setup)
XCODE_PLIST="$IOS_APP_DIR/Info.plist"
if [ -f "$XCODE_PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Delete :UIMainStoryboardFile" "$XCODE_PLIST" 2>/dev/null && \
        echo "Removed UIMainStoryboardFile" || echo "UIMainStoryboardFile already removed"

    /usr/libexec/PlistBuddy -c "Delete :UIDesignRequiresCompatibility" "$XCODE_PLIST" 2>/dev/null && \
        echo "Removed UIDesignRequiresCompatibility" || echo "UIDesignRequiresCompatibility already removed"
fi

# 3. Copy custom AppDelegate.swift
if [ -f "$NATIVE_DIR/AppDelegate.swift" ]; then
    cp "$NATIVE_DIR/AppDelegate.swift" "$IOS_APP_DIR/AppDelegate.swift"
    echo "Copied custom AppDelegate.swift"
fi

# 4. Copy LiquidGlassSceneDelegate.swift
if [ -f "$NATIVE_DIR/LiquidGlassSceneDelegate.swift" ]; then
    cp "$NATIVE_DIR/LiquidGlassSceneDelegate.swift" "$IOS_APP_DIR/LiquidGlassSceneDelegate.swift"
    echo "Copied LiquidGlassSceneDelegate.swift"
fi

# 5. Copy custom Info.plist (includes UIApplicationSceneManifest)
if [ -f "$NATIVE_DIR/Info.plist" ]; then
    cp "$NATIVE_DIR/Info.plist" "$IOS_APP_DIR/Info.plist"
    echo "Copied custom Info.plist"
fi

# 6. Delete Main.storyboard
if [ -f "$IOS_APP_DIR/Base.lproj/Main.storyboard" ]; then
    rm "$IOS_APP_DIR/Base.lproj/Main.storyboard"
    echo "Deleted Main.storyboard"
fi

echo ""
echo "Post-sync fixup complete!"
echo ""
echo "In Xcode:"
echo "  1. File > Add Files > select LiquidGlassSceneDelegate.swift (in ios/App/App/)"
echo "  2. Make sure it's added to the App target"
echo "  3. Clean Build (Shift+Cmd+K)"
echo "  4. Run (Cmd+R)"