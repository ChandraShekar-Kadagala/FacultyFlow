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
                "AWAITING_CHECK_IN",

            reason:
                "Attendance has not been recorded yet today. Use Check In below to evaluate verification signals.",

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
                            "AWAITING_CHECK_IN",

                        reason:
                            type === "LOCATION"
                                ? "Device GPS coordinates will be captured and verified against the campus geofence."
                                : type === "IDENTITY"
                                    ? "Authenticated faculty identity session will be verified."
                                    : type === "SCHEDULE"
                                        ? "Current server time will be verified against the attendance policy window."
                                        : type === "NETWORK"
                                            ? "Network signals are evaluated on mobile apps; web browsers verify location & session."
                                            : "Device signal will be evaluated upon check-in submission."

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