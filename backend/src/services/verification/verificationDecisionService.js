import {
    VERIFICATION_RESULTS,
    VERIFICATION_STATUS,
    VERIFICATION_TYPES
} from "./verificationConstants.js";


// ============================================================
// DEFAULT REQUIRED SIGNALS
// ============================================================
//
// Based on the FacultyFlow attendance logic:
//
// Identity       -> required
// Location       -> required
// Schedule       -> required
//
// Device/network are policy-dependent.
//
// The policy can override this list.
//

const DEFAULT_REQUIRED_TYPES = [

    VERIFICATION_TYPES.IDENTITY,

    VERIFICATION_TYPES.LOCATION

];


// ============================================================
// NORMALIZE REQUIRED TYPES
// ============================================================

function normalizeRequiredTypes(
    requiredTypes
) {

    if (
        !Array.isArray(
            requiredTypes
        )
    ) {

        return DEFAULT_REQUIRED_TYPES;

    }


    return requiredTypes.filter(
        type =>
            Object.values(
                VERIFICATION_TYPES
            ).includes(type)
    );

}


// ============================================================
// GET RESULT FOR TYPE
// ============================================================

function getResultForType(
    results,
    type
) {

    return results.find(
        result =>
            result.type === type
    );

}


// ============================================================
// CHECK REQUIRED RESULTS
// ============================================================

function evaluateRequiredResults({

    results,

    requiredTypes

}) {

    const requiredResults =
        requiredTypes.map(
            type =>
                getResultForType(
                    results,
                    type
                )
        );


    // --------------------------------------------------------
    // Missing required provider result
    // --------------------------------------------------------

    const missingRequired =
        requiredResults.filter(
            result =>
                !result
        );


    if (
        missingRequired.length > 0
    ) {

        return {

            status:
                VERIFICATION_STATUS.PENDING,

            reason:
                "One or more required verification providers did not return a result.",

            blockingTypes:
                requiredTypes.filter(
                    type =>
                        !getResultForType(
                            results,
                            type
                        )
                )

        };

    }


    // --------------------------------------------------------
    // Required verification FAILED
    // --------------------------------------------------------

    const failedRequired =
        requiredResults.filter(
            result =>
                result.result ===
                VERIFICATION_RESULTS.FAILED
        );


    if (
        failedRequired.length > 0
    ) {

        return {

            status:
                VERIFICATION_STATUS.FAILED,

            reason:
                "One or more required verification checks failed.",

            blockingTypes:
                failedRequired.map(
                    result =>
                        result.type
                )

        };

    }


    // --------------------------------------------------------
    // Required verification unavailable
    // --------------------------------------------------------

    const unavailableRequired =
        requiredResults.filter(
            result =>
                result.result ===
                VERIFICATION_RESULTS.UNAVAILABLE
        );


    if (
        unavailableRequired.length > 0
    ) {

        return {

            status:
                VERIFICATION_STATUS.PENDING,

            reason:
                "One or more required verification signals are unavailable.",

            blockingTypes:
                unavailableRequired.map(
                    result =>
                        result.type
                )

        };

    }


    // --------------------------------------------------------
    // Required verification pending
    // --------------------------------------------------------

    const pendingRequired =
        requiredResults.filter(
            result =>
                result.result ===
                VERIFICATION_RESULTS.PENDING
        );


    if (
        pendingRequired.length > 0
    ) {

        return {

            status:
                VERIFICATION_STATUS.PENDING,

            reason:
                "One or more required verification checks are pending.",

            blockingTypes:
                pendingRequired.map(
                    result =>
                        result.type
                )

        };

    }


    // --------------------------------------------------------
    // Everything required passed
    // --------------------------------------------------------

    return {

        status:
            VERIFICATION_STATUS.VERIFIED,

        reason:
            "All required verification checks passed.",

        blockingTypes: []

    };

}


// ============================================================
// AGGREGATE VERIFICATION RESULTS
// ============================================================

export function aggregateVerificationResults({

    results = [],

    requiredTypes = DEFAULT_REQUIRED_TYPES

} = {}) {

    const normalizedRequiredTypes =
        normalizeRequiredTypes(
            requiredTypes
        );


    const decision =
        evaluateRequiredResults({

            results,

            requiredTypes:
                normalizedRequiredTypes

        });


    return {

        status:
            decision.status,

        reason:
            decision.reason,

        blockingTypes:
            decision.blockingTypes,

        requiredTypes:
            normalizedRequiredTypes,

        results

    };

}