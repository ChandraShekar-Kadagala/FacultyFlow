// ============================================================
// VERIFICATION TYPES
// ============================================================

export const VERIFICATION_TYPES = {

    IDENTITY:
        "IDENTITY",

    DEVICE:
        "DEVICE",

    NETWORK:
        "NETWORK",

    LOCATION:
        "LOCATION",

    SCHEDULE:
        "SCHEDULE"

};


// ============================================================
// VERIFICATION RESULTS
// ============================================================

export const VERIFICATION_RESULTS = {

    VERIFIED:
        "VERIFIED",

    PENDING:
        "PENDING",

    FAILED:
        "FAILED",

    UNAVAILABLE:
        "UNAVAILABLE"

};


// ============================================================
// OVERALL VERIFICATION STATUS
// ============================================================

export const VERIFICATION_STATUS = {

    VERIFIED:
        "Verified",

    PENDING:
        "Pending",

    FAILED:
        "Failed"

};


// ============================================================
// VERIFICATION REASONS
// ============================================================

export const VERIFICATION_REASONS = {

    IDENTITY_VERIFIED:
        "Faculty identity verified.",

    DEVICE_VERIFIED:
        "Device verification succeeded.",

    NETWORK_VERIFIED:
        "University network verification succeeded.",

    LOCATION_VERIFIED:
        "Campus location verification succeeded.",

    SCHEDULE_VERIFIED:
        "Schedule and time verification succeeded.",

    DEVICE_SIGNAL_UNAVAILABLE:
        "Device verification signal is unavailable.",

    NETWORK_SIGNAL_UNAVAILABLE:
        "Network verification signal is unavailable.",

    LOCATION_SIGNAL_UNAVAILABLE:
        "Location verification signal is unavailable.",

    SCHEDULE_NOT_AVAILABLE:
        "Schedule verification is unavailable.",

    VERIFICATION_PENDING:
        "Verification is pending.",

    VERIFICATION_COMPLETED:
        "All required verification checks passed.",

    VERIFICATION_FAILED:
        "One or more required verification checks failed."

};