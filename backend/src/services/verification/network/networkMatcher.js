// ============================================================
// NORMALIZE VALUE
// ============================================================

function normalizeValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .trim()
        .toLowerCase();

}


// ============================================================
// MATCH SSID
// ============================================================

export function matchesSSID(
    observedSSID,
    expectedSSID
) {

    if (
        !observedSSID ||
        !expectedSSID
    ) {

        return false;

    }


    return (
        normalizeValue(observedSSID) ===
        normalizeValue(expectedSSID)
    );

}


// ============================================================
// MATCH BSSID
// ============================================================

export function matchesBSSID(
    observedBSSID,
    expectedBSSIDs = []
) {

    if (
        !observedBSSID ||
        !Array.isArray(expectedBSSIDs)
    ) {

        return false;

    }


    const normalizedObserved =
        normalizeValue(
            observedBSSID
        );


    return expectedBSSIDs.some(
        bssid =>
            normalizeValue(bssid) ===
            normalizedObserved
    );

}


// ============================================================
// MATCH IP RANGE
// ============================================================
//
// NOTE:
// This function intentionally supports exact IP values
// for the current foundation.
//
// CIDR/range matching can be added in the dedicated
// network configuration hardening step.
//

export function matchesIPAddress(
    observedIP,
    allowedIPRanges = []
) {

    if (
        !observedIP ||
        !Array.isArray(allowedIPRanges)
    ) {

        return false;

    }


    const normalizedIP =
        normalizeValue(
            observedIP
        );


    return allowedIPRanges.some(
        range =>
            normalizeValue(range) ===
            normalizedIP
    );

}