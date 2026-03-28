#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_APP_DIR="$PROJECT_ROOT/ios/App/App"
NATIVE_DIR="$PROJECT_ROOT/ios-native"

echo "Post-sync fixup starting..."

# 1. Remove UIApplicationSceneManifest (forces AppDelegate lifecycle)
XCODE_PLIST="$IOS_APP_DIR/Info.plist"
if [ -f "$XCODE_PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Delete :UIApplicationSceneManifest" "$XCODE_PLIST" 2>/dev/null && \
        echo "Removed UIApplicationSceneManifest" || echo "UIApplicationSceneManifest already removed"
    /usr/libexec/PlistBuddy -c "Delete :UIMainStoryboardFile" "$XCODE_PLIST" 2>/dev/null && \
        echo "Removed UIMainStoryboardFile" || echo "UIMainStoryboardFile already removed"
    /usr/libexec/PlistBuddy -c "Delete :UIDesignRequiresCompatibility" "$XCODE_PLIST" 2>/dev/null && \
        echo "Removed UIDesignRequiresCompatibility" || echo "UIDesignRequiresCompatibility already removed"
fi

# 2. Delete SceneDelegate.swift
if [ -f "$IOS_APP_DIR/SceneDelegate.swift" ]; then
    rm "$IOS_APP_DIR/SceneDelegate.swift"
    echo "Deleted SceneDelegate.swift"
fi

# 3. Delete Main.storyboard
if [ -f "$IOS_APP_DIR/Base.lproj/Main.storyboard" ]; then
    rm "$IOS_APP_DIR/Base.lproj/Main.storyboard"
    echo "Deleted Main.storyboard"
fi

# 4. Copy custom files
if [ -f "$NATIVE_DIR/AppDelegate.swift" ]; then
    cp "$NATIVE_DIR/AppDelegate.swift" "$IOS_APP_DIR/AppDelegate.swift"
    echo "Copied AppDelegate.swift"
fi

if [ -f "$NATIVE_DIR/Info.plist" ]; then
    cp "$NATIVE_DIR/Info.plist" "$IOS_APP_DIR/Info.plist"
    echo "Copied Info.plist"
fi

# 5. Remove LiquidGlassSceneDelegate if leftover from previous approach
if [ -f "$IOS_APP_DIR/LiquidGlassSceneDelegate.swift" ]; then
    rm "$IOS_APP_DIR/LiquidGlassSceneDelegate.swift"
    echo "Removed old LiquidGlassSceneDelegate.swift"
fi

echo ""
echo "Done! In Xcode:"
echo "  1. Remove LiquidGlassSceneDelegate.swift from project if referenced"
echo "  2. Deployment Target = 26.0"
echo "  3. Clean Build (Shift+Cmd+K)"
echo "  4. Run (Cmd+R)"