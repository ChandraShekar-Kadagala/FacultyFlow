import {
    VERIFICATION_TYPES,
    VERIFICATION_RESULTS
} from "./verificationConstants";


const DISPLAY_ORDER = [

    VERIFICATION_TYPES.IDENTITY,

    VERIFICATION_TYPES.DEVICE,

    VERIFICATION_TYPES.NETWORK,

    VERIFICATION_TYPES.LOCATION,

    VERIFICATION_TYPES.SCHEDULE

];


const LABELS = {

    IDENTITY:
        "Identity",

    DEVICE:
        "Device",

    NETWORK:
        "University Network",

    LOCATION:
        "Campus Location",

    SCHEDULE:
        "Schedule"

};


const DESCRIPTIONS = {

    IDENTITY:
        "Authenticated faculty identity",

    DEVICE:
        "Configured device signal",

    NETWORK:
        "University network signal",

    LOCATION:
        "Campus geofence",

    SCHEDULE:
        "Attendance time policy"

};


export function normalizeVerificationResult(
    verification
) {

    if (!verification) {

        return {

            overallResult:
                VERIFICATION_RESULTS.PENDING,

            reason:
                "Verification result is not available.",

            sessionId:
                null,

            checks:
                DISPLAY_ORDER.map(

                    type => ({

                        type,

                        label:
                            LABELS[type],

                        description:
                            DESCRIPTIONS[type],

                        result:
                            VERIFICATION_RESULTS.UNAVAILABLE,

                        reason:
                            "No verification result is available."

                    })

                )

        };

    }


    /*
     * Support the normal provider-result collection.
     *
     * The backend may expose the provider results through
     * `checks` or `events`, so we normalize either form.
     */

    const rawChecks =

        Array.isArray(
            verification.checks
        )

            ? verification.checks

            : Array.isArray(
                verification.events
            )

                ? verification.events

                : [];


    const checksByType =
        new Map();


    rawChecks.forEach(
        check => {

            if (!check?.type) {

                return;

            }


            checksByType.set(

                check.type,

                check

            );

        }
    );


    const checks =
        DISPLAY_ORDER.map(

            type => {

                const check =
                    checksByType.get(
                        type
                    );


                return {

                    type,

                    label:
                        LABELS[type],

                    description:
                        DESCRIPTIONS[type],

                    result:
                        check?.result ||

                        VERIFICATION_RESULTS.UNAVAILABLE,

                    reason:
                        check?.reason ||

                        "This verification signal is not available."

                };

            }

        );


    return {

        overallResult:
            verification.result ||

            VERIFICATION_RESULTS.PENDING,

        reason:
            verification.reason ||

            "Verification result received.",

        sessionId:
            verification.verificationSessionId ||

            verification.sessionId ||

            null,

        checks

    };

}