import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Location from "expo-location";

/**
 * Collects safe device observation metadata.
 * Does NOT collect raw biometrics or private hardware fingerprints.
 */
export async function getDeviceSignal() {
    try {
        return {
            deviceId: Device.osBuildId || `${Platform.OS}-${Device.modelName || "device"}`,
            platform: Platform.OS.toUpperCase(),
            model: Device.modelName || Device.productName || "Mobile Device",
            osVersion: Device.osVersion || "Unknown",
            isDevice: Device.isDevice ?? true
        };
    } catch (_err) {
        return {
            platform: Platform.OS.toUpperCase(),
            isDevice: false
        };
    }
}

/**
 * Safely captures GPS location observations if permission is granted.
 * If permission is denied or device does not have GPS, returns null without faking.
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

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            return {
                signal: null,
                permissionStatus: "denied",
                message: "Location permission was denied by the user. Attendance verification will evaluate without GPS coordinates."
            };
        }

        const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
        });

        if (!position || !position.coords) {
            return {
                signal: null,
                permissionStatus: "unavailable",
                message: "Unable to retrieve current coordinates from device GPS."
            };
        }

        return {
            signal: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracyMeters: position.coords.accuracy || 10
            },
            permissionStatus: "granted",
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
