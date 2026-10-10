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

export async function verifyNetwork() {

    // --------------------------------------------------------
    // Get network signal from current web adapter
    // --------------------------------------------------------

    const signal =
        getWebNetworkSignal();


    // --------------------------------------------------------
    // Current web client cannot expose the required
    // Wi-Fi information.
    // --------------------------------------------------------

    if (
        signal.capability ===
        "UNAVAILABLE"
    ) {

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