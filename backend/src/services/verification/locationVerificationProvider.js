import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";


// ============================================================
// LOCATION VERIFICATION
// ============================================================

export async function verifyLocation() {

    // --------------------------------------------------------
    // Browser geolocation has not yet been integrated with
    // FacultyFlow's configured CampusLocation model.
    //
    // Do not claim location verification.
    // --------------------------------------------------------

    return {

        type: "LOCATION",

        result:
            VERIFICATION_RESULTS.UNAVAILABLE,

        reason:
            VERIFICATION_REASONS.LOCATION_SIGNAL_UNAVAILABLE,

        metadata: {

            platform:
                "WEB",

            capability:
                "LOCATION_NOT_INTEGRATED"

        }

    };

}