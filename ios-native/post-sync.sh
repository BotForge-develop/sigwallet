#!/bin/bash
# =============================================================================
# post-sync.sh — Run this AFTER every "npx cap sync ios"
#
# Capacitor regenerates SceneDelegate.swift and UIApplicationSceneManifest
# on every sync, which overrides our programmatic UITabBarController in
# AppDelegate and prevents Liquid Glass from working.
#
# This script fixes that by:
# 1. Deleting SceneDelegate.swift
# 2. Removing UIApplicationSceneManifest from Info.plist
# 3. Removing UIMainStoryboardFile from Info.plist
# 4. Copying our custom AppDelegate.swift and Info.plist
# =============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_APP_DIR="$PROJECT_ROOT/ios/App/App"
NATIVE_DIR="$PROJECT_ROOT/ios-native"

echo "🔧 Post-sync fixup starting..."

# 1. Delete SceneDelegate.swift if it exists
if [ -f "$IOS_APP_DIR/SceneDelegate.swift" ]; then
    rm "$IOS_APP_DIR/SceneDelegate.swift"
    echo "✅ Deleted SceneDelegate.swift"
else
    echo "ℹ️  SceneDelegate.swift already removed"
fi

# 2. Remove UIApplicationSceneManifest from Xcode's Info.plist
XCODE_PLIST="$IOS_APP_DIR/Info.plist"
if [ -f "$XCODE_PLIST" ]; then
    # Remove UIApplicationSceneManifest key and its value
    /usr/libexec/PlistBuddy -c "Delete :UIApplicationSceneManifest" "$XCODE_PLIST" 2>/dev/null && \
        echo "✅ Removed UIApplicationSceneManifest from Info.plist" || \
        echo "ℹ️  UIApplicationSceneManifest already removed"

    # Remove UIMainStoryboardFile key
    /usr/libexec/PlistBuddy -c "Delete :UIMainStoryboardFile" "$XCODE_PLIST" 2>/dev/null && \
        echo "✅ Removed UIMainStoryboardFile from Info.plist" || \
        echo "ℹ️  UIMainStoryboardFile already removed"

    # Remove UIDesignRequiresCompatibility if present (blocks Liquid Glass)
    /usr/libexec/PlistBuddy -c "Delete :UIDesignRequiresCompatibility" "$XCODE_PLIST" 2>/dev/null && \
        echo "✅ Removed UIDesignRequiresCompatibility from Info.plist" || \
        echo "ℹ️  UIDesignRequiresCompatibility already removed"
fi

# 3. Copy our custom AppDelegate.swift
if [ -f "$NATIVE_DIR/AppDelegate.swift" ]; then
    cp "$NATIVE_DIR/AppDelegate.swift" "$IOS_APP_DIR/AppDelegate.swift"
    echo "✅ Copied custom AppDelegate.swift"
fi

# 4. Copy our custom Info.plist
if [ -f "$NATIVE_DIR/Info.plist" ]; then
    cp "$NATIVE_DIR/Info.plist" "$IOS_APP_DIR/Info.plist"
    echo "✅ Copied custom Info.plist"
fi

# 5. Delete Main.storyboard if it exists
if [ -f "$IOS_APP_DIR/Base.lproj/Main.storyboard" ]; then
    rm "$IOS_APP_DIR/Base.lproj/Main.storyboard"
    echo "✅ Deleted Main.storyboard"
fi

echo ""
echo "🎉 Post-sync fixup complete!"
echo ""
echo "Next steps:"
echo "  1. Open ios/App/App.xcworkspace in Xcode"
echo "  2. Set iOS Deployment Target to 26.0"
echo "  3. Clean Build (⇧⌘K)"
echo "  4. Run on device (⌘R)"
