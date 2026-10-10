import AttendancePolicy
    from "../../models/AttendancePolicy.js";

import {
    VERIFICATION_TYPES
} from "../verification/verificationConstants.js";


// ============================================================
// DEFAULT VERIFICATION REQUIREMENTS
// ============================================================

const DEFAULT_REQUIRED_TYPES = [

    VERIFICATION_TYPES.IDENTITY,

    VERIFICATION_TYPES.LOCATION,

    VERIFICATION_TYPES.SCHEDULE

];


// ============================================================
// VALID VERIFICATION TYPES
// ============================================================

const VALID_VERIFICATION_TYPES =

    new Set(

        Object.values(
            VERIFICATION_TYPES
        )

    );


// ============================================================
// TIME VALIDATION
// ============================================================

function isValidTime(
    value
) {

    return (

        typeof value ===
        "string"

        &&

        /^([01]\d|2[0-3]):([0-5]\d)$/
            .test(value)

    );

}


// ============================================================
// CONVERT HH:mm → MINUTES
// ============================================================

function timeToMinutes(
    value
) {

    if (
        !isValidTime(value)
    ) {

        return null;

    }


    const [
        hours,
        minutes
    ] =
        value
            .split(":")
            .map(Number);


    return (
        hours * 60
        +
        minutes
    );

}


// ============================================================
// SERVER DATE MINUTES
// ============================================================

function dateToMinutes(
    date
) {

    return (

        date.getHours() * 60

        +

        date.getMinutes()

    );

}


// ============================================================
// NORMALIZE REQUIRED SIGNALS
// ============================================================

function normalizeRequiredSignals(
    value
) {

    if (
        value === undefined
        ||
        value === null
    ) {

        return [];

    }


    if (
        !Array.isArray(value)
    ) {

        const error =
            new Error(
                "requiredSignals must be an array."
            );

        error.statusCode =
            400;

        error.code =
            "INVALID_REQUIRED_SIGNALS";

        throw error;

    }


    const normalized =
        value.map(

            signal => {

                if (
                    typeof signal !==
                    "string"
                ) {

                    const error =
                        new Error(
                            "Each required verification signal must be a string."
                        );

                    error.statusCode =
                        400;

                    error.code =
                        "INVALID_REQUIRED_SIGNAL";

                    throw error;

                }


                return signal
                    .trim()
                    .toUpperCase();

            }

        );


    const uniqueSignals =
        [

            ...new Set(
                normalized
            )

        ];


    const invalidSignals =
        uniqueSignals.filter(

            signal =>
                !VALID_VERIFICATION_TYPES
                    .has(signal)

        );


    if (
        invalidSignals.length > 0
    ) {

        const error =
            new Error(

                `Unsupported verification signal(s): ${invalidSignals.join(", ")}`

            );

        error.statusCode =
            400;

        error.code =
            "UNSUPPORTED_VERIFICATION_SIGNAL";

        error.invalidSignals =
            invalidSignals;

        throw error;

    }


    return uniqueSignals;

}


// ============================================================
// STRICT BOOLEAN
// ============================================================

function normalizeBoolean(
    value,
    fieldName
) {

    if (
        value === undefined
        ||
        value === null
    ) {

        return undefined;

    }


    if (
        typeof value !==
        "boolean"
    ) {

        const error =
            new Error(
                `${fieldName} must be a boolean.`
            );

        error.statusCode =
            400;

        error.code =
            "INVALID_BOOLEAN_FIELD";

        throw error;

    }


    return value;

}


// ============================================================
// NON-NEGATIVE NUMBER
// ============================================================

function normalizeNonNegativeNumber(
    value,
    fieldName
) {

    if (
        value === undefined
        ||
        value === null
    ) {

        return undefined;

    }


    if (
        typeof value !==
        "number"

        ||

        !Number.isFinite(value)

        ||

        value < 0

    ) {

        const error =
            new Error(
                `${fieldName} must be a non-negative number.`
            );

        error.statusCode =
            400;

        error.code =
            "INVALID_POLICY_NUMBER";

        throw error;

    }


    return value;

}


// ============================================================
// NORMALIZE POLICY INPUT
// ============================================================

function normalizePolicyInput(
    input,
    existing = null
) {

    const source = {

        ...(existing
            ? existing.toObject()
            : {}),

        ...(input || {})

    };


    // --------------------------------------------------------
    // TIME
    // --------------------------------------------------------

    if (
        !isValidTime(
            source.startTime
        )
    ) {

        const error =
            new Error(
                "startTime must use HH:mm format."
            );

        error.statusCode =
            400;

        error.code =
            "INVALID_START_TIME";

        throw error;

    }


    if (
        !isValidTime(
            source.endTime
        )
    ) {

        const error =
            new Error(
                "endTime must use HH:mm format."
            );

        error.statusCode =
            400;

        error.code =
            "INVALID_END_TIME";

        throw error;

    }


    const startMinutes =
        timeToMinutes(
            source.startTime
        );

    const endMinutes =
        timeToMinutes(
            source.endTime
        );


    // --------------------------------------------------------
    // SAME-DAY POLICY WINDOW
    // --------------------------------------------------------

    if (
        endMinutes <=
        startMinutes
    ) {

        const error =
            new Error(
                "endTime must be later than startTime."
            );

        error.statusCode =
            400;

        error.code =
            "INVALID_POLICY_TIME_RANGE";

        throw error;

    }


    // --------------------------------------------------------
    // NUMERIC SETTINGS
    // --------------------------------------------------------

    const gracePeriod =
        normalizeNonNegativeNumber(

            source.gracePeriod,

            "gracePeriod"

        );


    const lateThreshold =
        normalizeNonNegativeNumber(

            source.lateThreshold,

            "lateThreshold"

        );


    const earlyExitThreshold =
        normalizeNonNegativeNumber(

            source.earlyExitThreshold,

            "earlyExitThreshold"

        );


    // --------------------------------------------------------
    // VERIFICATION SIGNALS
    // --------------------------------------------------------

    const requiredSignals =
        normalizeRequiredSignals(

            source.requiredSignals

        );


    // --------------------------------------------------------
    // ACTIVE
    // --------------------------------------------------------

    const active =
        normalizeBoolean(

            source.active,

            "active"

        );


    return {

        startTime:
            source.startTime,

        endTime:
            source.endTime,

        gracePeriod:
            gracePeriod ?? 0,

        lateThreshold:
            lateThreshold ?? 0,

        earlyExitThreshold:
            earlyExitThreshold ?? 0,

        requiredSignals,

        active:
            active ?? true

    };

}


// ============================================================
// POLICY ID
// ============================================================

function generatePolicyId() {

    return (

        `POL-${Date.now()}-${Math.random()`
        +
        `.toString(36).slice(2, 10)}`

    );

}


// ============================================================
// GET ACTIVE POLICY
// ============================================================

export async function getActiveAttendancePolicy() {

    const activePolicies =
        await AttendancePolicy.find({

            active:
                true

        })

        .sort({

            createdAt:
                -1

        });


    // --------------------------------------------------------
    // NO ACTIVE POLICY
    // --------------------------------------------------------

    if (
        activePolicies.length ===
        0
    ) {

        const error =
            new Error(
                "No active attendance policy is configured."
            );

        error.statusCode =
            503;

        error.code =
            "ATTENDANCE_POLICY_UNAVAILABLE";

        throw error;

    }


    // --------------------------------------------------------
    // DATA INTEGRITY VIOLATION
    // --------------------------------------------------------

    if (
        activePolicies.length >
        1
    ) {

        const error =
            new Error(
                "Multiple active attendance policies were detected."
            );

        error.statusCode =
            500;

        error.code =
            "MULTIPLE_ACTIVE_POLICIES";

        throw error;

    }


    return activePolicies[0];

}


// ============================================================
// GET REQUIRED VERIFICATION TYPES
// ============================================================

export function getRequiredVerificationTypes(
    policy
) {

    const signals =
        policy?.requiredSignals;


    if (
        !Array.isArray(signals)
        ||
        signals.length === 0
    ) {

        return [

            ...DEFAULT_REQUIRED_TYPES

        ];

    }


    return [

        ...new Set(

            signals
                .filter(

                    signal =>
                        VALID_VERIFICATION_TYPES
                            .has(signal)

                )

        )

    ];

}


// ============================================================
// GET ALL POLICIES
// ============================================================

export async function getAllPolicies() {

    return AttendancePolicy.find()

        .sort({

            active:
                -1,

            createdAt:
                -1

        });

}


// ============================================================
// GET POLICY BY ID
// ============================================================

export async function getPolicyById(
    policyId
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.statusCode =
            400;

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    const policy =
        await AttendancePolicy.findOne({

            policyId

        });


    if (!policy) {

        const error =
            new Error(
                "Attendance policy was not found."
            );

        error.statusCode =
            404;

        error.code =
            "POLICY_NOT_FOUND";

        throw error;

    }


    return policy;

}


// ============================================================
// CREATE POLICY
// ============================================================

export async function createAttendancePolicy(
    input
) {

    const normalized =
        normalizePolicyInput(
            input
        );


    // --------------------------------------------------------
    // GENERATE SERVER POLICY ID
    // --------------------------------------------------------

    const policyId =
        generatePolicyId();


    // --------------------------------------------------------
    // ACTIVE POLICY SAFETY
    // --------------------------------------------------------

    if (
        normalized.active
    ) {

        await AttendancePolicy.updateMany(

            {

                active:
                    true

            },

            {

                $set: {

                    active:
                        false

                }

            }

        );

    }


    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    try {

        return await AttendancePolicy.create({

            policyId,

            ...normalized

        });

    } catch (error) {

        // ----------------------------------------------------
        // UNIQUE ACTIVE POLICY RACE
        // ----------------------------------------------------

        if (
            error?.code ===
            11000
        ) {

            const conflict =
                new Error(
                    "Another active attendance policy was created concurrently. Please retry."
                );

            conflict.statusCode =
                409;

            conflict.code =
                "POLICY_CONFLICT";

            throw conflict;

        }


        throw error;

    }

}


// ============================================================
// UPDATE POLICY
// ============================================================

export async function updateAttendancePolicy(

    policyId,

    input

) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.statusCode =
            400;

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    const existing =
        await AttendancePolicy.findOne({

            policyId

        });


    if (!existing) {

        const error =
            new Error(
                "Attendance policy was not found."
            );

        error.statusCode =
            404;

        error.code =
            "POLICY_NOT_FOUND";

        throw error;

    }


    const normalized =
        normalizePolicyInput(

            input,

            existing

        );


    // --------------------------------------------------------
    // ACTIVATE THIS POLICY
    // --------------------------------------------------------

    if (
        normalized.active
    ) {

        await AttendancePolicy.updateMany(

            {

                policyId: {

                    $ne:
                        policyId

                },

                active:
                    true

            },

            {

                $set: {

                    active:
                        false

                }

            }

        );

    }


    // --------------------------------------------------------
    // APPLY UPDATE
    // --------------------------------------------------------

    existing.startTime =
        normalized.startTime;

    existing.endTime =
        normalized.endTime;

    existing.gracePeriod =
        normalized.gracePeriod;

    existing.lateThreshold =
        normalized.lateThreshold;

    existing.earlyExitThreshold =
        normalized.earlyExitThreshold;

    existing.requiredSignals =
        normalized.requiredSignals;

    existing.active =
        normalized.active;


    try {

        return await existing.save();

    } catch (error) {

        if (
            error?.code ===
            11000
        ) {

            const conflict =
                new Error(
                    "Another active attendance policy already exists. Please retry."
                );

            conflict.statusCode =
                409;

            conflict.code =
                "POLICY_CONFLICT";

            throw conflict;

        }


        throw error;

    }

}


// ============================================================
// ACTIVATE POLICY
// ============================================================

export async function activateAttendancePolicy(
    policyId
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.statusCode =
            400;

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    const policy =
        await AttendancePolicy.findOne({

            policyId

        });


    if (!policy) {

        const error =
            new Error(
                "Attendance policy was not found."
            );

        error.statusCode =
            404;

        error.code =
            "POLICY_NOT_FOUND";

        throw error;

    }


    // --------------------------------------------------------
    // DEACTIVATE OTHER POLICIES
    // --------------------------------------------------------

    await AttendancePolicy.updateMany(

        {

            policyId: {

                $ne:
                    policyId

            },

            active:
                true

        },

        {

            $set: {

                active:
                    false

            }

        }

    );


    // --------------------------------------------------------
    // ACTIVATE TARGET
    // --------------------------------------------------------

    policy.active =
        true;


    try {

        return await policy.save();

    } catch (error) {

        if (
            error?.code ===
            11000
        ) {

            const conflict =
                new Error(
                    "Another active attendance policy exists. Please retry."
                );

            conflict.statusCode =
                409;

            conflict.code =
                "POLICY_CONFLICT";

            throw conflict;

        }


        throw error;

    }

}


// ============================================================
// DEACTIVATE POLICY
// ============================================================

export async function deactivateAttendancePolicy(
    policyId
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.statusCode =
            400;

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    const policy =
        await AttendancePolicy.findOne({

            policyId

        });


    if (!policy) {

        const error =
            new Error(
                "Attendance policy was not found."
            );

        error.statusCode =
            404;

        error.code =
            "POLICY_NOT_FOUND";

        throw error;

    }


    // --------------------------------------------------------
    // PREVENT EMPTY RUNTIME POLICY
    // --------------------------------------------------------

    if (
        policy.active
    ) {

        const otherActivePolicy =
            await AttendancePolicy.exists({

                policyId: {

                    $ne:
                        policyId

                },

                active:
                    true

            });


        if (!otherActivePolicy) {

            const error =
                new Error(
                    "The active attendance policy cannot be deactivated because no replacement policy is active."
                );

            error.statusCode =
                409;

            error.code =
                "ACTIVE_POLICY_REQUIRED";

            throw error;

        }

    }


    policy.active =
        false;


    return policy.save();

}


// ============================================================
// CHECK-IN POLICY EVALUATION
// ============================================================

export function evaluateCheckInPolicy({

    policy,

    serverTime

}) {

    if (!policy) {

        const error =
            new Error(
                "Attendance policy is unavailable."
            );

        error.statusCode =
            503;

        error.code =
            "ATTENDANCE_POLICY_UNAVAILABLE";

        throw error;

    }


    const startMinutes =
        timeToMinutes(
            policy.startTime
        );

    const endMinutes =
        timeToMinutes(
            policy.endTime
        );


    if (
        startMinutes === null
        ||
        endMinutes === null
    ) {

        const error =
            new Error(
                "Attendance policy contains invalid time configuration."
            );

        error.statusCode =
            500;

        error.code =
            "INVALID_ATTENDANCE_POLICY";

        throw error;

    }


    const currentMinutes =
        dateToMinutes(
            serverTime
        );


    const graceEnd =
        startMinutes
        +
        policy.gracePeriod;


    // --------------------------------------------------------
    // BEFORE START
    // --------------------------------------------------------

    if (
        currentMinutes <
        startMinutes
    ) {

        return {

            allowed:
                false,

            status:
                "Rejected",

            policyState:
                "BEFORE_START",

            reason:
                "Attendance check-in has not started yet."

        };

    }


    // --------------------------------------------------------
    // WITHIN GRACE
    // --------------------------------------------------------

    if (
        currentMinutes <=
        graceEnd
    ) {

        return {

            allowed:
                true,

            status:
                "Present",

            policyState:
                "ON_TIME",

            reason:
                "Attendance check-in is within the allowed grace period."

        };

    }


    // --------------------------------------------------------
    // LATE BUT WITHIN WINDOW
    // --------------------------------------------------------

    if (
        currentMinutes <=
        endMinutes
    ) {

        return {

            allowed:
                true,

            status:
                "Late",

            policyState:
                "LATE",

            reason:
                "Attendance check-in is late but still within the allowed window."

        };

    }


    // --------------------------------------------------------
    // AFTER END
    // --------------------------------------------------------

    return {

        allowed:
            false,

        status:
            "Rejected",

        policyState:
            "AFTER_END",

        reason:
            "Attendance check-in window has ended."

    };

}


// ============================================================
// CHECK-OUT POLICY EVALUATION
// ============================================================

export function evaluateCheckOutPolicy({

    policy,

    serverTime

}) {

    if (!policy) {

        const error =
            new Error(
                "Attendance policy is unavailable."
            );

        error.statusCode =
            503;

        error.code =
            "ATTENDANCE_POLICY_UNAVAILABLE";

        throw error;

    }


    const endMinutes =
        timeToMinutes(
            policy.endTime
        );


    if (
        endMinutes === null
    ) {

        const error =
            new Error(
                "Attendance policy contains invalid end time."
            );

        error.statusCode =
            500;

        error.code =
            "INVALID_ATTENDANCE_POLICY";

        throw error;

    }


    const currentMinutes =
        dateToMinutes(
            serverTime
        );


    const earlyExitBoundary =

        endMinutes
        -
        policy.earlyExitThreshold;


    const earlyExit =

        currentMinutes <
        earlyExitBoundary;


    return {

        allowed:
            true,

        earlyExit,

        policyState:
            earlyExit
                ? "EARLY_EXIT"
                : "NORMAL_EXIT",

        reason:
            earlyExit
                ? "Faculty checked out before the configured early-exit boundary."
                : "Faculty checked out within the configured exit policy."

    };

}