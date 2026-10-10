// ============================================================
// DEVICE SECURITY UTILITIES
// ============================================================


// ============================================================
// SUPPORTED DEVICE TYPES
// ============================================================

export const DEVICE_TYPES = {

    WEB:
        "WEB",

    MOBILE:
        "MOBILE",

    UNKNOWN:
        "UNKNOWN"

};


// ============================================================
// DEVICE CAPABILITIES
// ============================================================

export const DEVICE_CAPABILITIES = {

    BIOMETRIC:
        "BIOMETRIC",

    DEVICE_AUTHENTICATION:
        "DEVICE_AUTHENTICATION",

    NONE:
        "NONE"

};


// ============================================================
// NORMALIZE DEVICE ID
// ============================================================
//
// IMPORTANT:
// This function does NOT create or store a raw hardware
// identifier.
//
// A production mobile implementation should provide an
// application-scoped/device-scoped identifier through the
// platform adapter.
//

export function normalizeDeviceId(
    deviceId
) {

    if (
        !deviceId
    ) {

        return null;

    }


    return String(
        deviceId
    )
        .trim()
        .slice(
            0,
            128
        );

}


// ============================================================
// VALIDATE DEVICE SIGNAL
// ============================================================

export function hasValidDeviceSignal(
    signal
) {

    if (
        !signal ||
        typeof signal !==
        "object"
    ) {

        return false;

    }


    return Boolean(
        signal.deviceId ||
        signal.capability
    );

}