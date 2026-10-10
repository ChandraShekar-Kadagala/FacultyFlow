import AttendancePolicy
    from "../../../models/AttendancePolicy.js";

import {
    VERIFICATION_RESULTS
} from "../verificationConstants.js";

import {
    timeToMinutes,
    dateToMinutes,
    isWithinStartWindow,
    isWithinAttendanceWindow,
    isAfterEndTime
} from "./scheduleMatcher.js";


// ============================================================
// GET ACTIVE ATTENDANCE POLICY
// ============================================================

async function getActiveAttendancePolicy() {

    return AttendancePolicy.findOne({

        active: true

    })
        .sort({

            createdAt: -1

        })
        .lean();

}


// ============================================================
// VERIFY SCHEDULE / TIME
// ============================================================

export async function verifyScheduleTime({

    serverTime = new Date(),

    action = "CHECK_IN"

} = {}) {

    // --------------------------------------------------------
    // Validate server time
    // --------------------------------------------------------

    if (
        !(serverTime instanceof Date) ||
        Number.isNaN(
            serverTime.getTime()
        )
    ) {

        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Authoritative server time is invalid.",

            metadata: {

                timeSource:
                    "SERVER"

            }

        };

    }


    // --------------------------------------------------------
    // Get active policy
    // --------------------------------------------------------

    const policy =
        await getActiveAttendancePolicy();


    // --------------------------------------------------------
    // No policy configured
    // --------------------------------------------------------

    if (!policy) {

        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.PENDING,

            reason:
                "No active attendance schedule policy is configured.",

            metadata: {

                configuration:
                    "NOT_CONFIGURED",

                timeSource:
                    "SERVER"

            }

        };

    }


    // --------------------------------------------------------
    // Convert policy times
    // --------------------------------------------------------

    const startMinutes =
        timeToMinutes(
            policy.startTime
        );


    const endMinutes =
        timeToMinutes(
            policy.endTime
        );


    // --------------------------------------------------------
    // Validate policy
    // --------------------------------------------------------

    if (
        startMinutes === null ||
        endMinutes === null
    ) {

        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Attendance policy contains an invalid time configuration.",

            metadata: {

                policyId:
                    policy.policyId,

                timeSource:
                    "SERVER"

            }

        };

    }


    // --------------------------------------------------------
    // Invalid schedule range
    // --------------------------------------------------------

    if (
        endMinutes <
        startMinutes
    ) {

        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Attendance policy end time cannot be earlier than the start time.",

            metadata: {

                policyId:
                    policy.policyId,

                startTime:
                    policy.startTime,

                endTime:
                    policy.endTime

            }

        };

    }


    // --------------------------------------------------------
    // Current SERVER time
    // --------------------------------------------------------

    const currentMinutes =
        dateToMinutes(
            serverTime
        );


    // --------------------------------------------------------
    // CHECK-IN
    // --------------------------------------------------------

    if (
        action ===
        "CHECK_IN"
    ) {

        // --------------------------------------------
        // Before allowed start
        // --------------------------------------------

        if (
            currentMinutes <
            startMinutes
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.FAILED,

                reason:
                    "Check-in is not yet within the allowed attendance window.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    gracePeriod:
                        policy.gracePeriod,

                    timeSource:
                        "SERVER"

                }

            };

        }


        // --------------------------------------------
        // Within grace period
        // --------------------------------------------

        if (
            isWithinStartWindow({

                currentMinutes,

                startMinutes,

                gracePeriod:
                    policy.gracePeriod

            })
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Check-in is within the configured attendance start window.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    gracePeriod:
                        policy.gracePeriod,

                    attendanceStatus:
                        "ON_TIME",

                    timeSource:
                        "SERVER"

                }

            };

        }


        // --------------------------------------------
        // After grace period but before end
        // --------------------------------------------

        if (
            isWithinAttendanceWindow({

                currentMinutes,

                startMinutes,
                endMinutes

            })
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Check-in is within the configured attendance period but after the grace period.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    gracePeriod:
                        policy.gracePeriod,

                    attendanceStatus:
                        "LATE",

                    timeSource:
                        "SERVER"

                }

            };

        }


        // --------------------------------------------
        // After end
        // --------------------------------------------

        if (
            isAfterEndTime({

                currentMinutes,

                endMinutes

            })
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.FAILED,

                reason:
                    "Check-in is outside the configured attendance period.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    timeSource:
                        "SERVER"

                }

            };

        }

    }


    // --------------------------------------------------------
    // CHECK-OUT
    // --------------------------------------------------------

    if (
        action ===
        "CHECK_OUT"
    ) {

        // --------------------------------------------
        // Before start
        // --------------------------------------------

        if (
            currentMinutes <
            startMinutes
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.FAILED,

                reason:
                    "Check-out is not allowed before the configured attendance period begins.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    timeSource:
                        "SERVER"

                }

            };

        }


        // --------------------------------------------
        // During attendance period
        // --------------------------------------------

        if (
            isWithinAttendanceWindow({

                currentMinutes,

                startMinutes,

                endMinutes

            })
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Check-out is within the configured attendance period.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    attendanceStatus:
                        "WITHIN_WINDOW",

                    timeSource:
                        "SERVER"

                }

            };

        }


        // --------------------------------------------
        // After end time
        // --------------------------------------------

        if (
            isAfterEndTime({

                currentMinutes,

                endMinutes

            })
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Check-out occurred after the configured attendance end time.",

                metadata: {

                    action,

                    currentTime:
                        serverTime.toISOString(),

                    startTime:
                        policy.startTime,

                    endTime:
                        policy.endTime,

                    attendanceStatus:
                        "EXIT_AFTER_END",

                    timeSource:
                        "SERVER"

                }

            };

        }

    }


    // --------------------------------------------------------
    // Unsupported action
    // --------------------------------------------------------

    return {

        type: "SCHEDULE",

        result:
            VERIFICATION_RESULTS.FAILED,

        reason:
            "Unsupported attendance action.",

        metadata: {

            action

        }

    };

}