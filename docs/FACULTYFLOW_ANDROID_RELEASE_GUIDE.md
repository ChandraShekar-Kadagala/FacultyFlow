# FacultyFlow Android Release & APK Deployment Guide

**Document Version:** 1.0.0  
**Target Platform:** Android (API Level 24+ / Android 7.0 through Android 14)  
**Package Identifier:** `com.facultyflow.app`  
**Expo SDK:** 57 (React Native 0.86.3)  

---

## 1. Overview

This document provides end-to-end operational instructions for building, installing, verifying, and troubleshooting the standalone **FacultyFlow Android Application (`.apk`)**.

Two build pathways are supported:
1. **Cloud Build via EAS (Expo Application Services)** — Recommended: zero local Android SDK / NDK required.
2. **Local Native Build via Android SDK & Gradle** — For offline build pipelines or enterprise air-gapped environments.

---

## 2. Configuration Inventory

The application has been pre-configured with production release settings:

### 2.1 `app.json` Configuration
* **App Name:** `FacultyFlow Mobile`
* **Slug:** `facultyflow-mobile`
* **Package Name:** `com.facultyflow.app`
* **Version:** `1.0.0`
* **Version Code:** `1`
* **Permissions Configured:**
  * `ACCESS_FINE_LOCATION` (High-accuracy GPS verification)
  * `ACCESS_COARSE_LOCATION` (Cell/WiFi network location fallback)
  * `INTERNET` (Network communication with backend API)
  * `ACCESS_NETWORK_STATE` (NetInfo offline/online transition detection)
* **Plugins:** `expo-location`, `expo-secure-store`, `expo-sqlite`

### 2.2 `eas.json` Profiles
Located at `frontend/facultyflow-mobile/eas.json`:
* **`preview` profile:** Builds a standalone, installable `.apk` file (no Google Play account required, direct sideloading). Injects `EXPO_PUBLIC_API_URL: "https://facultyflow-1kgs.onrender.com/api"`.
* **`production` profile:** Configured for production APK distribution targeting Render production backend.

---

## 3. Build Procedure A: Cloud Build via EAS (Recommended)

EAS Build runs the Android compilation pipeline in a managed Linux container with the exact JDK, Android SDK, and NDK versions pre-installed.

### Step 1: Install EAS CLI & Authenticate
Open your terminal in `frontend/facultyflow-mobile/`:
```powershell
cd "c:\Users\k.chandra shekar\Faculty Flow\frontend\facultyflow-mobile"
npx eas login
```
*If you do not have an Expo account, sign up for free at [expo.dev/signup](https://expo.dev/signup).*

### Step 2: Trigger the Standalone APK Build
Run the build command targeting the `preview` profile:
```powershell
npx eas build -p android --profile preview
```

### Step 3: Monitor and Download
1. EAS will display a real-time web URL tracking build progress.
2. The compilation typically takes 5–8 minutes.
3. Upon completion, EAS provides a direct download link and QR code for the generated `application-preview.apk`.
4. Download the `.apk` file to your computer or directly to the target Android device.

---

## 4. Build Procedure B: Local Native Build via Android SDK & Gradle

If you have a local development machine with Android Studio or an enterprise build agent, follow this procedure.

### Prerequisites:
1. **Java Development Kit (JDK):** OpenJDK 17. Verify via `java -version`.
2. **Android SDK Tools:**
   * Android SDK Platform 34 (`platforms;android-34`)
   * Android SDK Build-Tools 34.0.0 (`build-tools;34.0.0`)
   * Android SDK Platform-Tools (`platform-tools` including `adb.exe`)
   * Android SDK Command-line Tools (`cmdline-tools;latest`)
3. **Environment Variables:**
   ```powershell
   [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\<username>\AppData\Local\Android\Sdk", "User")
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17...", "User")
   # Ensure %ANDROID_HOME%\platform-tools is in PATH
   ```

### Local Build Commands:
```powershell
cd "c:\Users\k.chandra shekar\Faculty Flow\frontend\facultyflow-mobile"

# 1. Generate the native android project directory
npx expo prebuild --platform android

# 2. Compile the release APK using Gradle
cd android
.\gradlew.bat assembleRelease

# 3. Output location:
# android\app\build\outputs\apk\release\app-release.apk
```

---

## 5. Installation & Sideloading Instructions

### Method A: Sideloading via USB / Direct Download (No PC required)
1. Copy the downloaded `.apk` file to the Android device via USB, email, Google Drive, or direct link.
2. On the Android device, open **Files** or your download manager and tap the `.apk` file.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable **Allow from this source**.
   - Return and tap **Install**.
4. Tap **Open** once installation completes.

### Method B: Installation via ADB (Developer Mode)
1. Enable **Developer Options** on your Android device (tap *Build Number* in Settings > About Phone 7 times).
2. Enable **USB Debugging** in Developer Options.
3. Connect the phone to your PC via USB and authorize the computer.
4. Verify device detection:
   ```powershell
   adb devices
   ```
5. Install the APK:
   ```powershell
   adb install -r "path\to\facultyflow-app.apk"
   ```

---

## 6. Runtime Permissions & Device Setup

When opening the app for the first time, Android will request essential runtime permissions:

1. **Location Permission (`ACCESS_FINE_LOCATION`):**
   - **Dialog Prompt:** *"Allow FacultyFlow to access this device's location?"*
   - **Required Selection:** Select **"While using the app"** (Precise location enabled).
   - **Rationale:** High-precision GPS is required by the campus geofencing policy engine to verify faculty presence within designated campus boundaries.
2. **Network Connection:**
   - Both cellular data and Wi-Fi are supported.
   - For campus Wi-Fi verification policies, ensure Wi-Fi is toggled ON even if mobile data is active.

---

## 7. Real-Device Verification Checklist & Smoke Test

Execute this 8-step smoke test on the physical device to certify release readiness:

| Step | Action | Expected Result | Verified (Y/N) |
| :---: | :--- | :--- | :---: |
| **1** | Launch App from Home Screen | App boots cleanly without crash, displays FacultyFlow branding and Login screen. | [ ] |
| **2** | Faculty Authentication | Enter valid faculty credentials (`email` / `password`). Tap **Sign In**. | [ ] |
| **3** | Profile & State Hydration | Dashboard loads showing faculty name, department, employee ID, and current attendance status. | [ ] |
| **4** | Online Check-In | Tap **Check In**. Location prompt resolves GPS coordinates. Check-in succeeds with On-Time/Late badge. | [ ] |
| **5** | Offline Resilience Test | Enable **Airplane Mode** (disconnect Wi-Fi and mobile data). Tap **Check Out**. | [ ] |
| **6** | Offline Queue Persistence | App displays confirmation: *"Saved locally (Offline)"*. Pending queue badge shows `1`. | [ ] |
| **7** | Automatic Synchronization | Disable Airplane Mode. Observe NetInfo reconnection. Within 3-5 seconds, sync executes and pending badge clears to `0`. | [ ] |
| **8** | History & Session Durability | Navigate to **History** tab; verify today's check-in and check-out are listed. Tap **Sign Out**; verify return to Login screen. | [ ] |

---

## 8. Troubleshooting & Common Issues

### Issue 1: "Network request failed" or API Timeout on Physical Device
- **Root Cause:** App build attempting to connect to `localhost` or `10.0.2.2` instead of the public Render backend.
- **Resolution:** Verify that `eas.json` has `EXPO_PUBLIC_API_URL: "https://facultyflow-1kgs.onrender.com/api"` and `NODE_ENV: "production"` was active during compilation. Verify internet connectivity on device.

### Issue 2: "Location permission denied"
- **Root Cause:** User denied location prompt or selected "Don't allow".
- **Resolution:** Open Android device **Settings > Apps > FacultyFlow > Permissions > Location**, and set to **Allow only while using the app** with **Use precise location** enabled.

### Issue 3: Duplicate Events During Rapid Tapping
- **Root Cause:** User rapidly taps Check-In or Sync while request is pending.
- **Resolution:** The mobile client is protected with UI button disabling during `isSubmitting` and internal synchronous mutex locking in `syncEngine.js`. If replayed, backend returns `SYNC_EVENT_DUPLICATE` without duplicating attendance.
