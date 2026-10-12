import * as LocalAuthentication from "expo-local-authentication";

/**
 * Checks biometric hardware capabilities and enrollment on this device.
 */
export async function getBiometricCapabilities() {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
            return {
                hasHardware: false,
                isEnrolled: false,
                isAvailable: false,
                biometricType: "NONE",
                biometricName: "Unavailable"
            };
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let biometricType = "FINGERPRINT";
        let biometricName = "Fingerprint";

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            biometricType = "FACIAL_RECOGNITION";
            biometricName = "Facial Recognition";
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            biometricType = "IRIS";
            biometricName = "Iris Recognition";
        }

        return {
            hasHardware: true,
            isEnrolled,
            isAvailable: hasHardware && isEnrolled,
            supportedTypes,
            biometricType,
            biometricName
        };
    } catch (err) {
        return {
            hasHardware: false,
            isEnrolled: false,
            isAvailable: false,
            biometricType: "NONE",
            biometricName: "Error",
            error: err.message
        };
    }
}

/**
 * Invokes native Android / iOS biometric prompt.
 * 
 * Security rules:
 * - Does NOT fake or animate a mock fingerprint.
 * - Does NOT collect, store, or transmit biometric templates.
 * - Confirms device-owner physical presence to create an authoritative observation.
 */
export async function authenticateBiometric(options = {}) {
    const promptMessage = options.promptMessage || "FacultyFlow Attendance Verification";
    const cancelLabel = options.cancelLabel || "Cancel";

    try {
        const capabilities = await getBiometricCapabilities();

        if (!capabilities.hasHardware) {
            return {
                success: false,
                code: "HARDWARE_UNAVAILABLE",
                reason: "Biometric hardware (fingerprint/face) is not available on this device.",
                capabilities
            };
        }

        if (!capabilities.isEnrolled) {
            return {
                success: false,
                code: "NOT_ENROLLED",
                reason: "No fingerprints or biometrics are enrolled on this phone. Please register a fingerprint in Android Settings.",
                capabilities
            };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel,
            fallbackLabel: "Use Device Credentials",
            disableDeviceFallback: false
        });

        if (result.success) {
            return {
                success: true,
                code: "SUCCESS",
                reason: `${capabilities.biometricName} verified successfully.`,
                capabilities
            };
        }

        if (result.error === "user_cancel" || result.error === "app_cancel") {
            return {
                success: false,
                code: "CANCELLED",
                reason: "Biometric verification was cancelled. Tap 'Authenticate' to retry.",
                capabilities
            };
        }

        if (result.error === "lockout") {
            return {
                success: false,
                code: "LOCKOUT",
                reason: "Biometric sensor is temporarily locked due to too many failed attempts.",
                capabilities
            };
        }

        return {
            success: false,
            code: result.error || "FAILED",
            reason: result.warning || "Biometric authentication was not recognized. Please try again.",
            capabilities
        };
    } catch (err) {
        return {
            success: false,
            code: "EXCEPTION",
            reason: err.message || "An unexpected error occurred during biometric authentication.",
            capabilities: null
        };
    }
}

/**
 * Standardized check object for verification step execution.
 */
export async function verifyBiometric(options = {}) {
    const authResult = await authenticateBiometric(options);
    return {
        key: "biometric",
        type: "DEVICE",
        label: "Device Biometric Authentication",
        status: authResult.success ? "passed" : (authResult.code === "CANCELLED" ? "waiting_user" : "failed"),
        passed: authResult.success,
        available: authResult.capabilities?.isAvailable ?? false,
        reason: authResult.reason,
        code: authResult.code,
        diagnostics: authResult.capabilities
            ? `${authResult.capabilities.biometricName} (${authResult.capabilities.isEnrolled ? "Enrolled" : "Not Enrolled"})`
            : "Sensor Query Failed"
    };
}