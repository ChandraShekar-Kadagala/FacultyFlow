import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";

import {
    verifyNetworkSignal
} from "../network/networkVerificationService.js";

import {
    getWebNetworkSignal
} from "../network/networkClientAdapter.js";


// ============================================================
// NETWORK VERIFICATION PROVIDER
// ============================================================

export async function verifyNetwork({
    networkSignal = null
} = {}) {

    // --------------------------------------------------------
    // Get network signal from client or fallback to web adapter
    // --------------------------------------------------------

    const signal =
        networkSignal ||
        getWebNetworkSignal();


    // --------------------------------------------------------
    // Check if network signal is unavailable
    // --------------------------------------------------------

    if (
        !signal ||
        signal.capability === "UNAVAILABLE" ||
        (!signal.observedSSID && !signal.observedBSSID && !signal.observedIP)
    ) {

        return {

            type: "NETWORK",

            result:
                VERIFICATION_RESULTS.UNAVAILABLE,

            reason:
                VERIFICATION_REASONS.NETWORK_SIGNAL_UNAVAILABLE,

            metadata: {

                platform:
                    signal?.platform || "WEB",

                capability:
                    signal?.capability || "NETWORK_SIGNAL_NOT_EXPOSED"

            }

        };

    }


    // --------------------------------------------------------
    // Verify available signal
    // --------------------------------------------------------

    return verifyNetworkSignal({

        observedSSID:
            signal.observedSSID,

        observedBSSID:
            signal.observedBSSID,

        observedIP:
            signal.observedIP

    });

}