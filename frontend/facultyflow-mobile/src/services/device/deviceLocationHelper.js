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
            // Guard getCurrentPositionAsync with an 8-second timeout to prevent indefinite hanging on cold fixes
            const currentPositionPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("LOCATION_TIMEOUT")), 8000)
            );
            position = await Promise.race([currentPositionPromise, timeoutPromise]);
        } catch (_posErr) {
            if (Location.getLastKnownPositionAsync) {
                try {
                    const lastKnown = await Location.getLastKnownPositionAsync();
                    // Accept cached location if acquired within the past 5 minutes (300,000 ms)
                    if (lastKnown?.coords && lastKnown.timestamp && (Date.now() - lastKnown.timestamp < 300000)) {
                        position = lastKnown;
                    }
                } catch (_lastErr) {
                    // Fall through
                }
            }
        }

        if (!position || !position.coords) {
            return {
                signal: null,
                permissionStatus: "unavailable",
                message: "Unable to retrieve GPS coordinates within allowable timeout. Ensure device GPS is active and has clear reception."
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
