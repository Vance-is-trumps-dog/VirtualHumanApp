# VirtualHumanApp iOS

This directory contains the iOS project for VirtualHumanApp.

## Building

To build this project locally on macOS:

```bash
# Install dependencies
cd ios
pod install

# Build the app
cd ..
npx react-native run-ios
```

## GitHub Actions

The iOS build is automated via GitHub Actions. See `.github/workflows/ios-build.yml` for details.
