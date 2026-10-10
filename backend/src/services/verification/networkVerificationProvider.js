import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";


// ============================================================
// NETWORK VERIFICATION
// ============================================================

export async function verifyNetwork() {

    // --------------------------------------------------------
    // Browser cannot reliably expose the Wi-Fi SSID/BSSID
    // information required by our verification architecture.
    //
    // Therefore we report unavailable instead of pretending
    // that the faculty is connected to university Wi-Fi.
    // --------------------------------------------------------

    return {

        type: "NETWORK",

        result:
            VERIFICATION_RESULTS.UNAVAILABLE,

        reason:
            VERIFICATION_REASONS.NETWORK_SIGNAL_UNAVAILABLE,

        metadata: {

            platform:
                "WEB",

            capability:
                "NETWORK_SIGNAL_NOT_EXPOSED"

        }

    };

}