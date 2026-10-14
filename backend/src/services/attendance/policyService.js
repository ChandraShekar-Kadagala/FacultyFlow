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

    VERIFICATION_TYPES.LOCATION

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
// ============================================================
// SERVER DATE MINUTES (TIMEZONE AWARE)
// ============================================================

export function dateToMinutes(
    date,
    timezone = "Asia/Kolkata"
) {

    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    try {

        const formatter =
            new Intl.DateTimeFormat("en-US", {

                timeZone: timezone || "Asia/Kolkata",

                hour: "numeric",

                minute: "numeric",

                hour12: false

            });

        const parts =
            formatter.formatToParts(date);

        let hour = 0;
        let minute = 0;

        for (const part of parts) {

            if (part.type === "hour") {

                hour = parseInt(part.value, 10);

                if (hour === 24) hour = 0;

            } else if (part.type === "minute") {

                minute = parseInt(part.value, 10);

            }

        }

        return (hour * 60) + minute;

    } catch (_err) {

        return (
            date.getHours() * 60
        ) +
        date.getMinutes();

    }

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
    // TIME (OPTIONAL IN FLEXIBLE MODE)
    // --------------------------------------------------------

    let startTime = null;
    let endTime = null;

    if (
        source.startTime !== undefined &&
        source.startTime !== null &&
        typeof source.startTime === "string" &&
        source.startTime.trim() !== ""
    ) {
        const trimmedStart = source.startTime.trim();
        if (isValidTime(trimmedStart)) {
            startTime = trimmedStart;
        } else if (source.attendanceMode === "SCHEDULED") {
            const error = new Error("startTime must use HH:mm format.");
            error.statusCode = 400;
            error.code = "INVALID_START_TIME";
            throw error;
        }
    }

    if (
        source.endTime !== undefined &&
        source.endTime !== null &&
        typeof source.endTime === "string" &&
        source.endTime.trim() !== ""
    ) {
        const trimmedEnd = source.endTime.trim();
        if (isValidTime(trimmedEnd)) {
            endTime = trimmedEnd;
        } else if (source.attendanceMode === "SCHEDULED") {
            const error = new Error("endTime must use HH:mm format.");
            error.statusCode = 400;
            error.code = "INVALID_END_TIME";
            throw error;
        }
    }

    if (startTime && endTime) {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (endMinutes <= startMinutes && source.attendanceMode === "SCHEDULED") {
            const error = new Error("endTime must be later than startTime.");
            error.statusCode = 400;
            error.code = "INVALID_POLICY_TIME_RANGE";
            throw error;
        }
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


    const isScheduleEnabled =
        requiredSignals.includes("SCHEDULE");

    const attendanceMode =
        source.attendanceMode === "SCHEDULED" ||
        (isScheduleEnabled && source.attendanceMode !== "FLEXIBLE")
            ? "SCHEDULED"
            : "FLEXIBLE";

    const minWorkingHours =
        normalizeNonNegativeNumber(
            source.minWorkingHours,
            "minWorkingHours"
        );

    return {
        attendanceMode,
        startTime,
        endTime,
        gracePeriod: gracePeriod ?? 0,
        lateThreshold: lateThreshold ?? 0,
        earlyExitThreshold: earlyExitThreshold ?? 0,
        minWorkingHours: minWorkingHours ?? 0,
        requiredSignals,
        timezone:
            typeof source.timezone === "string" && source.timezone.trim()
                ? source.timezone.trim()
                : "Asia/Kolkata",
        active: active ?? true
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

    existing.attendanceMode =
        normalized.attendanceMode;

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

    existing.minWorkingHours =
        normalized.minWorkingHours;

    existing.requiredSignals =
        normalized.requiredSignals;

    existing.timezone =
        normalized.timezone;

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


    if (
        !(serverTime instanceof Date) ||
        Number.isNaN(serverTime.getTime())
    ) {

        return {

            allowed:
                false,

            status:
                "Rejected",

            policyState:
                "TIME_UNAVAILABLE",

            code:
                "SERVER_TIME_UNAVAILABLE",

            reason:
                "Authoritative server time is unavailable."

        };

    }


    const timezone =
        policy.timezone ||
        process.env.INSTITUTIONAL_TIMEZONE ||
        "Asia/Kolkata";

    const isScheduleRequired =
        Array.isArray(policy.requiredSignals) &&
        policy.requiredSignals.includes("SCHEDULE");

    const isScheduledMode =
        policy.attendanceMode === "SCHEDULED" ||
        (isScheduleRequired && policy.attendanceMode !== "FLEXIBLE");

    // ========================================================
    // FLEXIBLE ATTENDANCE (DEFAULT PRODUCT BEHAVIOR)
    // ========================================================
    if (!isScheduledMode) {
        return {
            allowed: true,
            status: "Present",
            policyState: "FLEXIBLE_DAY",
            code: "ATTENDANCE_FLEXIBLE_TIME",
            reason: "Flexible attendance check-in accepted.",
            metadata: {
                attendanceMode: "FLEXIBLE",
                timezone,
                serverTime: serverTime.toISOString()
            }
        };
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
        return {
            allowed: true,
            status: "Present",
            policyState: "FLEXIBLE_DAY",
            code: "ATTENDANCE_FLEXIBLE_TIME",
            reason: "Flexible attendance check-in accepted (schedule window not configured).",
            metadata: {
                attendanceMode: "FLEXIBLE",
                timezone,
                serverTime: serverTime.toISOString()
            }
        };
    }

    const currentMinutes =
        dateToMinutes(
            serverTime,
            timezone
        );


    const graceEnd =
        startMinutes
        +
        policy.gracePeriod;


    // --------------------------------------------------------
    // BOUNDARY 1: BEFORE START
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

            code:
                "ATTENDANCE_BEFORE_START_WINDOW",

            reason:
                `Attendance check-in has not started yet. Campus window opens at ${policy.startTime} (${timezone}).`,

            metadata: {

                currentMinutes,

                startMinutes,

                endMinutes,

                graceEnd,

                timezone,

                serverTime:
                    serverTime.toISOString()

            }

        };

    }


    // --------------------------------------------------------
    // BOUNDARY 2: WITHIN GRACE (ON TIME)
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

            code:
                "ATTENDANCE_ON_TIME",

            reason:
                "Attendance check-in is within the allowed grace period.",

            metadata: {

                currentMinutes,

                startMinutes,

                endMinutes,

                graceEnd,

                timezone,

                serverTime:
                    serverTime.toISOString()

            }

        };

    }


    // --------------------------------------------------------
    // BOUNDARY 3: LATE BUT WITHIN WINDOW
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

            code:
                "ATTENDANCE_LATE_WINDOW",

            reason:
                "Attendance check-in is late but still within the allowed window.",

            metadata: {

                currentMinutes,

                startMinutes,

                endMinutes,

                graceEnd,

                timezone,

                serverTime:
                    serverTime.toISOString()

            }

        };

    }


    // --------------------------------------------------------
    // BOUNDARY 4: AFTER END
    // --------------------------------------------------------

    return {

        allowed:
            false,

        status:
            "Rejected",

        policyState:
            "AFTER_END",

        code:
            "ATTENDANCE_AFTER_END_WINDOW",

        reason:
            `Attendance check-in window has ended. Campus window closed at ${policy.endTime} (${timezone}).`,

        metadata: {

            currentMinutes,

            startMinutes,

            endMinutes,

            graceEnd,

            timezone,

            serverTime:
                serverTime.toISOString()

        }

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


    const timezone =
        policy.timezone ||
        process.env.INSTITUTIONAL_TIMEZONE ||
        "Asia/Kolkata";

    const isScheduleRequired =
        Array.isArray(policy.requiredSignals) &&
        policy.requiredSignals.includes("SCHEDULE");

    const isScheduledMode =
        policy.attendanceMode === "SCHEDULED" ||
        (isScheduleRequired && policy.attendanceMode !== "FLEXIBLE");

    if (!isScheduledMode) {
        return {
            allowed: true,
            earlyExit: false,
            policyState: "NORMAL_EXIT",
            reason: "Flexible attendance checkout recorded successfully.",
            metadata: {
                attendanceMode: "FLEXIBLE",
                timezone,
                serverTime: serverTime.toISOString()
            }
        };
    }

    const endMinutes =
        timeToMinutes(
            policy.endTime
        );

    if (
        endMinutes === null
    ) {
        return {
            allowed: true,
            earlyExit: false,
            policyState: "NORMAL_EXIT",
            reason: "Attendance checkout completed.",
            metadata: {
                timezone,
                serverTime: serverTime.toISOString()
            }
        };
    }

    const currentMinutes =
        dateToMinutes(
            serverTime,
            timezone
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
                : "Faculty checked out within the configured exit policy.",

        metadata: {

            currentMinutes,

            endMinutes,

            earlyExitBoundary,

            timezone,

            serverTime:
                serverTime.toISOString()

        }

    };

}