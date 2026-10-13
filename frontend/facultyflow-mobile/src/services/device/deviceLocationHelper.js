import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Location from "expo-location";

/**
 * Collects safe device observation metadata and attaches real biometric verification results.
 * Does NOT collect or transmit raw biometric templates or sensitive hardware fingerprints.
 */
export async function getDeviceSignal(biometricResult = null) {
    try {
        const baseSignal = {
            deviceId: Device.osBuildId || `${Platform.OS}-${Device.modelName || "device"}`,
            platform: Platform.OS.toUpperCase(),
            model: Device.modelName || Device.productName || "Mobile Device",
            osVersion: Device.osVersion || "Unknown",
            isDevice: Device.isDevice ?? true
        };

        if (biometricResult) {
            const hasBio = Boolean(biometricResult.capabilities?.isAvailable);
            const verified = Boolean(biometricResult.success);

            return {
                ...baseSignal,
                capability: "BIOMETRIC",
                capabilityStatus: hasBio ? "AVAILABLE" : "UNAVAILABLE",
                biometricAvailable: hasBio,
                biometricVerified: verified,
                biometricType: biometricResult.capabilities?.biometricType || "FINGERPRINT"
            };
        }

        return {
            ...baseSignal,
            capability: "DEVICE_AUTHENTICATION",
            capabilityStatus: "AVAILABLE",
            biometricAvailable: false,
            biometricVerified: false
        };
    } catch (_err) {
        return {
            platform: Platform.OS.toUpperCase(),
            isDevice: false,
            capability: "DEVICE_AUTHENTICATION",
            capabilityStatus: "UNAVAILABLE",
            biometricAvailable: false,
            biometricVerified: false
        };
    }
}

/**
 * Checks current location permission state without triggering a prompt.
 */
export async function checkLocationPermission() {
    try {
        if (!Location || !Location.getForegroundPermissionsAsync) {
            return { granted: false, canAskAgain: false, status: "unsupported" };
        }
        const perm = await Location.getForegroundPermissionsAsync();
        return {
            granted: perm.status === "granted",
            canAskAgain: perm.canAskAgain,
            status: perm.status
        };
    } catch (_err) {
        return { granted: false, canAskAgain: false, status: "error" };
    }
}

/**
 * Explicitly triggers the Android system location permission prompt.
 */
export async function requestLocationPermission() {
    try {
        if (!Location || !Location.requestForegroundPermissionsAsync) {
            return { granted: false, canAskAgain: false, status: "unsupported" };
        }
        const perm = await Location.requestForegroundPermissionsAsync();
        return {
            granted: perm.status === "granted",
            canAskAgain: perm.canAskAgain,
            status: perm.status
        };
    } catch (_err) {
        return { granted: false, canAskAgain: false, status: "error" };
    }
}

/**
 * Safely requests permission and captures GPS location observations.
 * Does not substitute hardcoded coordinates or claim permission equals validity.
 */
export async function getLocationSignal() {
    try {
        if (!Location || !Location.requestForegroundPermissionsAsync) {
            return {
                signal: null,
                permissionStatus: "unsupported",
                message: "Location services are not supported on this platform."
            };
        }

        // Check if GPS hardware / Location Services are enabled on the phone
        if (Location.hasServicesEnabledAsync) {
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                return {
                    signal: null,
                    permissionStatus: "services_disabled",
                    message: "Location Services (GPS) are turned off on your device. Please turn on Location in quick settings and retry."
                };
            }
        }

        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            return {
                signal: null,
                permissionStatus: canAskAgain ? "denied" : "permanently_denied",
                canAskAgain,
                message: canAskAgain
                    ? "Location permission was denied. Tap to grant permission to verify campus presence."
                    : "Location permission is blocked. Please enable 'Allow while using app' in Android App Settings."
            };
        }

        let position = null;
        try {
            position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });
        } catch (_posErr) {
            if (Location.getLastKnownPositionAsync) {
                position = await Location.getLastKnownPositionAsync();
            }
        }

        if (!position || !position.coords) {
            return {
                signal: null,
                permissionStatus: "unavailable",
                message: "Unable to retrieve GPS coordinates. Ensure your device has clear satellite reception or Wi-Fi scanning enabled."
            };
        }

        const accuracy = Math.round(position.coords.accuracy || 10);
        const captureTime = new Date(position.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        return {
            signal: {
                latitude: Number(position.coords.latitude.toFixed(6)),
                longitude: Number(position.coords.longitude.toFixed(6)),
                accuracyMeters: accuracy,
                timestamp: position.timestamp || Date.now()
            },
            permissionStatus: "granted",
            diagnostics: `Lat: ${position.coords.latitude.toFixed(4)}°, Lon: ${position.coords.longitude.toFixed(4)}° (±${accuracy}m at ${captureTime})`,
            message: "GPS coordinates captured successfully."
        };
    } catch (err) {
        return {
            signal: null,
            permissionStatus: "error",
            message: err.message || "An error occurred while requesting device location."
        };
    }
}
