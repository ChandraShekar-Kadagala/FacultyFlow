import NetworkLocation
    from "../../../models/NetworkLocation.js";

import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";

import {
    matchesSSID,
    matchesBSSID,
    matchesIPAddress
} from "./networkMatcher.js";


// ============================================================
// GET ACTIVE NETWORK CONFIGURATIONS
// ============================================================

async function getActiveNetworkLocations() {

    return NetworkLocation
        .find({
            active: true
        })
        .lean();

}


// ============================================================
// VERIFY NETWORK SIGNAL
// ============================================================

export async function verifyNetworkSignal({
    observedSSID = null,
    observedBSSID = null,
    observedIP = null
} = {}) {

    // --------------------------------------------------------
    // Load university network configuration
    // --------------------------------------------------------

    const networks =
        await getActiveNetworkLocations();


    // --------------------------------------------------------
    // No configuration
    // --------------------------------------------------------

    if (
        networks.length === 0
    ) {

        return {

            type: "NETWORK",

            result:
                VERIFICATION_RESULTS.PENDING,

            reason:
                "No active network verification configuration exists.",

            metadata: {

                configuration:
                    "NOT_CONFIGURED"

            }

        };

    }


    // --------------------------------------------------------
    // No usable client signal
    // --------------------------------------------------------

    if (
        !observedSSID &&
        !observedBSSID &&
        !observedIP
    ) {

        return {

            type: "NETWORK",

            result:
                VERIFICATION_RESULTS.UNAVAILABLE,

            reason:
                VERIFICATION_REASONS.NETWORK_SIGNAL_UNAVAILABLE,

            metadata: {

                configuration:
                    "AVAILABLE",

                clientSignal:
                    "NOT_EXPOSED"

            }

        };

    }


    // --------------------------------------------------------
    // Check configured networks
    // --------------------------------------------------------

    for (
        const network of networks
    ) {

        const ssidMatch =
            matchesSSID(
                observedSSID,
                network.expectedSSID
            );


        const bssidMatch =
            matchesBSSID(
                observedBSSID,
                network.expectedBSSIDs
            );


        const ipMatch =
            matchesIPAddress(
                observedIP,
                network.allowedIPRanges
            );


        // ----------------------------------------------------
        // Verification mode
        // ----------------------------------------------------

        let verified = false;


        switch (
            network.verificationMode
        ) {

            case "SSID":

                verified =
                    ssidMatch;

                break;


            case "BSSID":

                verified =
                    bssidMatch;

                break;


            case "IP_RANGE":

                verified =
                    ipMatch;

                break;


            case "BSSID_OR_IP":

                verified =
                    Boolean(network.expectedSSID && ssidMatch) ||
                    bssidMatch ||
                    ipMatch;

                break;


            case "BSSID_AND_IP":

                verified =
                    bssidMatch &&
                    ipMatch;

                break;


            default:

                verified =
                    Boolean(network.expectedSSID && ssidMatch) ||
                    bssidMatch ||
                    ipMatch;

        }


        // ----------------------------------------------------
        // MATCH
        // ----------------------------------------------------

        if (verified) {

            return {

                type: "NETWORK",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Configured university network signal matched.",

                metadata: {

                    networkLocationId:
                        network.networkLocationId,

                    verificationMode:
                        network.verificationMode,

                    ssidMatched:
                        ssidMatch,

                    bssidMatched:
                        bssidMatch,

                    ipMatched:
                        ipMatch

                }

            };

        }

    }


    // --------------------------------------------------------
    // SIGNAL AVAILABLE BUT NO MATCH
    // --------------------------------------------------------

    return {

        type: "NETWORK",

        result:
            VERIFICATION_RESULTS.FAILED,

        reason:
            "Observed network signal did not match an active university network configuration.",

        metadata: {

            configuration:
                "AVAILABLE",

            signalMatched:
                false

        }

    };

}