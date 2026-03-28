#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_APP_DIR="$PROJECT_ROOT/ios/App/App"
NATIVE_DIR="$PROJECT_ROOT/ios-native"

echo "Post-sync fixup starting..."

# 1. Delete SceneDelegate.swift
if [ -f "$IOS_APP_DIR/SceneDelegate.swift" ]; then
    rm "$IOS_APP_DIR/SceneDelegate.swift"
    echo "Deleted SceneDelegate.swift"
else
    echo "SceneDelegate.swift already removed"
fi

# 2. Fix Info.plist
XCODE_PLIST="$IOS_APP_DIR/Info.plist"
if [ -f "$XCODE_PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Delete :UIApplicationSceneManifest" "$XCODE_PLIST" 2>/dev/null && \
        echo "Removed UIApplicationSceneManifest" || echo "UIApplicationSceneManifest already removed"

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

# 4. Copy custom Info.plist
if [ -f "$NATIVE_DIR/Info.plist" ]; then
    cp "$NATIVE_DIR/Info.plist" "$IOS_APP_DIR/Info.plist"
    echo "Copied custom Info.plist"
fi

# 5. Copy LiquidGlassTabBar.swift
if [ -f "$NATIVE_DIR/LiquidGlassTabBar.swift" ]; then
    cp "$NATIVE_DIR/LiquidGlassTabBar.swift" "$IOS_APP_DIR/LiquidGlassTabBar.swift"
    echo "Copied LiquidGlassTabBar.swift"
fi

# 6. Delete Main.storyboard
if [ -f "$IOS_APP_DIR/Base.lproj/Main.storyboard" ]; then
    rm "$IOS_APP_DIR/Base.lproj/Main.storyboard"
    echo "Deleted Main.storyboard"
fi

echo ""
echo "Post-sync fixup complete!"
echo ""
echo "IMPORTANT: In Xcode you must:"
echo "  1. Add LiquidGlassTabBar.swift to the App target (File > Add Files)"
echo "  2. Set iOS Deployment Target to 26.0"
echo "  3. Clean Build Folder (Shift+Cmd+K)"
echo "  4. Run (Cmd+R)"
