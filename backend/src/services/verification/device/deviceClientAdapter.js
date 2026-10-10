// ============================================================
// DEVICE CLIENT ADAPTER
// ============================================================
//
// This adapter normalizes device capability information.
//
// IMPORTANT:
// - It does NOT perform biometric verification.
// - It does NOT fake biometric success.
// - It does NOT store raw biometric data.
// - Unsupported browser capabilities remain UNAVAILABLE.
//
// Real native biometric/WebAuthn integration can be connected
// later without changing the Verification Engine interface.
// ============================================================


// ============================================================
// WEB DEVICE SIGNAL
// ============================================================

export function getWebDeviceSignal(
    deviceSignal = null
) {

    // --------------------------------------------------------
    // No device signal supplied
    // --------------------------------------------------------

    if (
        !deviceSignal
    ) {

        return {

            capability:
                "UNAVAILABLE",

            deviceType:
                "WEB",

            biometricAvailable:
                false,

            biometricVerified:
                false

        };

    }


    // --------------------------------------------------------
    // Normalize supplied signal
    // --------------------------------------------------------

    return {

        capability:
            deviceSignal.capability ??
            "UNAVAILABLE",

        deviceType:
            deviceSignal.deviceType ??
            "WEB",

        deviceId:
            deviceSignal.deviceId ??
            null,

        biometricAvailable:
            deviceSignal.biometricAvailable ??
            false,

        biometricVerified:
            deviceSignal.biometricVerified ??
            false,

        capabilityStatus:
            deviceSignal.capabilityStatus ??
            "UNAVAILABLE"

    };

}