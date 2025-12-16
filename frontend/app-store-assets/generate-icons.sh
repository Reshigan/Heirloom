#!/bin/bash

# Heirloom App Icon Generator
# This script generates all required app icons for iOS and Android from a source image
# Requires: ImageMagick (convert command)

# Usage: ./generate-icons.sh <source-image.png>
# Source image should be at least 1024x1024 pixels

SOURCE_IMAGE=${1:-"icon-source.png"}

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image '$SOURCE_IMAGE' not found"
    echo "Usage: ./generate-icons.sh <source-image.png>"
    echo ""
    echo "The source image should be:"
    echo "  - At least 1024x1024 pixels"
    echo "  - PNG format"
    echo "  - Square aspect ratio"
    echo "  - No transparency (for iOS)"
    exit 1
fi

# Create output directories
mkdir -p ios-icons
mkdir -p android-icons/mipmap-mdpi
mkdir -p android-icons/mipmap-hdpi
mkdir -p android-icons/mipmap-xhdpi
mkdir -p android-icons/mipmap-xxhdpi
mkdir -p android-icons/mipmap-xxxhdpi

echo "Generating iOS icons..."

# iOS App Store
convert "$SOURCE_IMAGE" -resize 1024x1024 ios-icons/AppIcon-1024.png

# iOS iPhone icons
convert "$SOURCE_IMAGE" -resize 180x180 ios-icons/AppIcon-60@3x.png
convert "$SOURCE_IMAGE" -resize 120x120 ios-icons/AppIcon-60@2x.png

# iOS iPad icons
convert "$SOURCE_IMAGE" -resize 167x167 ios-icons/AppIcon-83.5@2x.png
convert "$SOURCE_IMAGE" -resize 152x152 ios-icons/AppIcon-76@2x.png
convert "$SOURCE_IMAGE" -resize 76x76 ios-icons/AppIcon-76.png

# iOS Spotlight icons
convert "$SOURCE_IMAGE" -resize 120x120 ios-icons/AppIcon-40@3x.png
convert "$SOURCE_IMAGE" -resize 80x80 ios-icons/AppIcon-40@2x.png
convert "$SOURCE_IMAGE" -resize 40x40 ios-icons/AppIcon-40.png

# iOS Settings icons
convert "$SOURCE_IMAGE" -resize 87x87 ios-icons/AppIcon-29@3x.png
convert "$SOURCE_IMAGE" -resize 58x58 ios-icons/AppIcon-29@2x.png
convert "$SOURCE_IMAGE" -resize 29x29 ios-icons/AppIcon-29.png

# iOS Notification icons
convert "$SOURCE_IMAGE" -resize 60x60 ios-icons/AppIcon-20@3x.png
convert "$SOURCE_IMAGE" -resize 40x40 ios-icons/AppIcon-20@2x.png
convert "$SOURCE_IMAGE" -resize 20x20 ios-icons/AppIcon-20.png

echo "Generating Android icons..."

# Android launcher icons (adaptive icon foreground)
convert "$SOURCE_IMAGE" -resize 48x48 android-icons/mipmap-mdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 72x72 android-icons/mipmap-hdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 96x96 android-icons/mipmap-xhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 144x144 android-icons/mipmap-xxhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 192x192 android-icons/mipmap-xxxhdpi/ic_launcher.png

# Android round icons
convert "$SOURCE_IMAGE" -resize 48x48 android-icons/mipmap-mdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 72x72 android-icons/mipmap-hdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 96x96 android-icons/mipmap-xhdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 144x144 android-icons/mipmap-xxhdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 192x192 android-icons/mipmap-xxxhdpi/ic_launcher_round.png

# Android adaptive icon foreground (with padding)
convert "$SOURCE_IMAGE" -resize 108x108 -gravity center -background none -extent 162x162 android-icons/mipmap-mdpi/ic_launcher_foreground.png
convert "$SOURCE_IMAGE" -resize 162x162 -gravity center -background none -extent 243x243 android-icons/mipmap-hdpi/ic_launcher_foreground.png
convert "$SOURCE_IMAGE" -resize 216x216 -gravity center -background none -extent 324x324 android-icons/mipmap-xhdpi/ic_launcher_foreground.png
convert "$SOURCE_IMAGE" -resize 324x324 -gravity center -background none -extent 486x486 android-icons/mipmap-xxhdpi/ic_launcher_foreground.png
convert "$SOURCE_IMAGE" -resize 432x432 -gravity center -background none -extent 648x648 android-icons/mipmap-xxxhdpi/ic_launcher_foreground.png

# Play Store icon (512x512)
convert "$SOURCE_IMAGE" -resize 512x512 android-icons/playstore-icon.png

echo "Generating splash screens..."

mkdir -p splash-screens

# iOS splash screens
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 2732x2732 splash-screens/splash-2732x2732.png
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 1334x750 splash-screens/splash-1334x750.png
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 2208x1242 splash-screens/splash-2208x1242.png

# Android splash screens
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 480x800 splash-screens/splash-port-mdpi.png
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 720x1280 splash-screens/splash-port-hdpi.png
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 1080x1920 splash-screens/splash-port-xhdpi.png
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 1440x2560 splash-screens/splash-port-xxhdpi.png
convert "$SOURCE_IMAGE" -resize 200x200 -gravity center -background "#050505" -extent 1920x3200 splash-screens/splash-port-xxxhdpi.png

echo ""
echo "Icon generation complete!"
echo ""
echo "iOS icons saved to: ios-icons/"
echo "Android icons saved to: android-icons/"
echo "Splash screens saved to: splash-screens/"
echo ""
echo "Next steps:"
echo "1. Copy iOS icons to: frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "2. Copy Android icons to: frontend/android/app/src/main/res/"
echo "3. Update Contents.json files as needed"
