import {

    createCheckIn,
    createCheckOut,
    getTodayAttendance,
    getAttendanceHistory

} from "../services/attendance/attendanceService.js";


import {

    recordAttendanceAttempt,
    recordAttendanceSuccess,
    recordAttendanceFailure

} from "../services/audit/auditService.js";


import {

    AUDIT_ACTIONS

} from "../services/audit/auditConstants.js";


import Faculty
    from "../models/Faculty.js";
import { getFacultyById } from "../services/faculty/facultyService.js";


import {

    runVerificationEngine

} from "../services/verification/verificationEngine.js";


import {

    getActiveAttendancePolicy,
    getRequiredVerificationTypes,
    evaluateCheckInPolicy,
    evaluateCheckOutPolicy

} from "../services/attendance/policyService.js";


// ============================================================
// GET TODAY
// ============================================================

export async function getTodayAttendanceController(

    req,
    res,
    next

) {

    try {

        const facultyId =
            req.user?.facultyId;


        if (!facultyId) {

            return res

                .status(400)

                .json({

                    success:
                        false,

                    code:
                        "FACULTY_PROFILE_UNAVAILABLE",

                    message:
                        "Authenticated faculty profile is not available."

                });

        }


        const attendance =
            await getTodayAttendance(
                facultyId
            );

        let verification = null;
        if (attendance && attendance.verificationSessionId) {
            const VerificationEvent = (await import("../models/VerificationEvent.js")).default;
            const events = await VerificationEvent.find({
                verificationSessionId: attendance.verificationSessionId
            });
            if (events && events.length > 0) {
                verification = {
                    result: attendance.verificationStatus.toUpperCase(),
                    reason: "Loaded from recent verification session.",
                    verificationSessionId: attendance.verificationSessionId,
                    events
                };
            }
        }

        return res
            .status(200)
            .json({
                success:
                    true,
                attendance,
                verification
            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET HISTORY
// ============================================================

export async function getAttendanceHistoryController(

    req,
    res,
    next

) {

    try {

        const facultyId =
            req.user?.facultyId;


        if (!facultyId) {

            return res

                .status(400)

                .json({

                    success:
                        false,

                    code:
                        "FACULTY_PROFILE_UNAVAILABLE",

                    message:
                        "Authenticated faculty profile is not available."

                });

        }


        const records =
            await getAttendanceHistory(

                facultyId

            );


        return res

            .status(200)

            .json({

                success:
                    true,

                count:
                    records.length,

                records

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// CHECK-IN
// ============================================================

export async function checkInController(

    req,
    res,
    next

) {

    const actorId =
        req.user?.userId;

    const actorRole =
        req.user?.role;

    const facultyId =
        req.user?.facultyId;


    // ========================================================
    // FACULTY VALIDATION
    // ========================================================

    if (!facultyId) {

        return res

            .status(400)

            .json({

                success:
                    false,

                code:
                    "FACULTY_PROFILE_UNAVAILABLE",

                message:
                    "Authenticated faculty profile is not available."

            });

    }


    // ========================================================
    // AUDIT — ATTEMPT
    // ========================================================

    try {

        await recordAttendanceAttempt({

            actorId,

            actorRole,

            action:
                AUDIT_ACTIONS
                    .CHECK_IN_ATTEMPT,

            facultyId

        });

    } catch (auditError) {

        console.error(

            "Failed to record check-in attempt audit:",

            auditError

        );

    }


    try {

        // ====================================================
        // ONE AUTHORITATIVE SERVER TIME
        // ====================================================

        const serverTime =
            new Date();


        // ====================================================
        // LOAD FACULTY
        // ====================================================

        let faculty = await Faculty.findOne({ facultyId });
        if (!faculty && req.user?.userId) {
            faculty = await Faculty.findOne({ userId: req.user.userId });
        }
        if (!faculty && (facultyId || req.user?.userId)) {
            faculty = await getFacultyById(facultyId || req.user?.userId);
        }


        if (!faculty) {

            const error =
                new Error(

                    "Faculty member was not found."

                );

            error.statusCode =
                404;

            error.code =
                "FACULTY_NOT_FOUND";

            throw error;

        }


        // ====================================================
        // LOAD ACTIVE POLICY
        // ====================================================

        const policy =
            await getActiveAttendancePolicy();


        // ====================================================
        // POLICY → VERIFICATION REQUIREMENTS
        // ====================================================

        const requiredTypes =
            getRequiredVerificationTypes(

                policy

            );


        // ====================================================
        // CLIENT VERIFICATION SIGNALS
        // ====================================================
        //
        // These are OBSERVATIONS only.
        //
        // The client cannot declare itself verified.
        //
        // ====================================================

        const deviceSignal =
            req.body?.device ||
            null;


        const networkSignal =
            req.body?.network ||
            null;


        const locationSignal =
            req.body?.location ||
            null;


        // ====================================================
        // RUN VERIFICATION ENGINE
        // ====================================================

        const verification =
            await runVerificationEngine({

                user:
                    req.user,

                faculty,

                attendanceId:
                    null,

                action:
                    "CHECK_IN",

                deviceSignal,

                networkSignal,

                locationSignal,

                serverTime,

                requiredTypes,

                policy

            });


        // ====================================================
        // VERIFICATION FAILED
        // ====================================================

        if (

            verification.result ===
            "FAILED"

        ) {

            const error =
                new Error(

                    verification.reason ||

                    "Attendance verification failed."

                );


            error.statusCode =
                403;

            error.code =
                "ATTENDANCE_VERIFICATION_FAILED";

            error.verification =
                verification;

            throw error;

        }


        // ====================================================
        // VERIFICATION NOT COMPLETE
        // ====================================================

        if (

            verification.result !==
            "VERIFIED"

        ) {

            const error =
                new Error(

                    verification.reason ||

                    "Attendance verification is incomplete."

                );


            error.statusCode =
                403;

            error.code =
                "ATTENDANCE_VERIFICATION_INCOMPLETE";

            error.verification =
                verification;

            throw error;

        }


        // ====================================================
        // ATTENDANCE TIME POLICY
        // ====================================================

        const policyDecision =
            evaluateCheckInPolicy({

                policy,

                serverTime

            });


        // ====================================================
        // OUTSIDE ATTENDANCE WINDOW
        // ====================================================

        if (

            !policyDecision.allowed

        ) {

            const error =
                new Error(

                    policyDecision.reason

                );


            error.statusCode =
                403;

            error.code =
                "ATTENDANCE_OUTSIDE_ALLOWED_TIME";

            error.policyDecision =
                policyDecision;

            error.verification =
                verification;

            throw error;

        }


        // ====================================================
        // CREATE ATTENDANCE
        // ====================================================

        const attendance =
            await createCheckIn({

                facultyId,

                verification,

                serverTime,

                attendanceStatus:
                    policyDecision.status

            });


        // ====================================================
        // AUDIT — SUCCESS
        // ====================================================

        try {

            await recordAttendanceSuccess({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .CHECK_IN_SUCCESS,

                facultyId,

                attendanceId:
                    attendance.attendanceId

            });

        } catch (auditError) {

            console.error(

                "Failed to record check-in success audit:",

                auditError

            );

        }


        // ====================================================
        // RESPONSE
        // ====================================================

        return res

            .status(201)

            .json({

                success:
                    true,

                code:
                    "ATTENDANCE_CHECK_IN_SUCCESS",

                message:
                    "Attendance checked in successfully.",

                attendance,

                verification,

                policy: {

                    state:
                        policyDecision.policyState,

                    status:
                        policyDecision.status,

                    reason:
                        policyDecision.reason

                }

            });


    } catch (error) {

        // ====================================================
        // AUDIT — FAILURE
        // ====================================================

        try {

            await recordAttendanceFailure({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .CHECK_IN_FAILED,

                facultyId,

                reason:
                    error.message ||
                    "Check-in failed."

            });

        } catch (auditError) {

            console.error(

                "Failed to record check-in failure audit:",

                auditError

            );

        }


        next(error);

    }

}


// ============================================================
// CHECK-OUT
// ============================================================

export async function checkOutController(

    req,
    res,
    next

) {

    const actorId =
        req.user?.userId;

    const actorRole =
        req.user?.role;

    const facultyId =
        req.user?.facultyId;


    // ========================================================
    // FACULTY VALIDATION
    // ========================================================

    if (!facultyId) {

        return res

            .status(400)

            .json({

                success:
                    false,

                code:
                    "FACULTY_PROFILE_UNAVAILABLE",

                message:
                    "Authenticated faculty profile is not available."

            });

    }


    // ========================================================
    // AUDIT — ATTEMPT
    // ========================================================

    try {

        await recordAttendanceAttempt({

            actorId,

            actorRole,

            action:
                AUDIT_ACTIONS
                    .CHECK_OUT_ATTEMPT,

            facultyId

        });

    } catch (auditError) {

        console.error(

            "Failed to record check-out attempt audit:",

            auditError

        );

    }


    try {

        // ====================================================
        // ONE AUTHORITATIVE SERVER TIME
        // ====================================================

        const serverTime =
            new Date();


        // ====================================================
        // LOAD FACULTY
        // ====================================================

        let faculty = await Faculty.findOne({ facultyId });
        if (!faculty && req.user?.userId) {
            faculty = await Faculty.findOne({ userId: req.user.userId });
        }
        if (!faculty && (facultyId || req.user?.userId)) {
            faculty = await getFacultyById(facultyId || req.user?.userId);
        }


        if (!faculty) {

            const error =
                new Error(

                    "Faculty member was not found."

                );

            error.statusCode =
                404;

            error.code =
                "FACULTY_NOT_FOUND";

            throw error;

        }


        // ====================================================
        // LOAD ACTIVE POLICY
        // ====================================================

        const policy =
            await getActiveAttendancePolicy();


        // ====================================================
        // POLICY → VERIFICATION REQUIREMENTS
        // ====================================================

        const requiredTypes =
            getRequiredVerificationTypes(

                policy

            );


        // ====================================================
        // CLIENT SIGNALS
        // ====================================================

        const deviceSignal =
            req.body?.device ||
            null;


        const networkSignal =
            req.body?.network ||
            null;


        const locationSignal =
            req.body?.location ||
            null;


        // ====================================================
        // RUN VERIFICATION ENGINE
        // ====================================================

        const verification =
            await runVerificationEngine({

                user:
                    req.user,

                faculty,

                attendanceId:
                    null,

                action:
                    "CHECK_OUT",

                deviceSignal,

                networkSignal,

                locationSignal,

                serverTime,

                requiredTypes,

                policy

            });


        // ====================================================
        // VERIFICATION FAILED
        // ====================================================

        if (

            verification.result ===
            "FAILED"

        ) {

            const error =
                new Error(

                    verification.reason ||

                    "Check-out verification failed."

                );


            error.statusCode =
                403;

            error.code =
                "ATTENDANCE_VERIFICATION_FAILED";

            error.verification =
                verification;

            throw error;

        }


        // ====================================================
        // VERIFICATION INCOMPLETE
        // ====================================================

        if (

            verification.result !==
            "VERIFIED"

        ) {

            const error =
                new Error(

                    verification.reason ||

                    "Check-out verification is incomplete."

                );


            error.statusCode =
                403;

            error.code =
                "ATTENDANCE_VERIFICATION_INCOMPLETE";

            error.verification =
                verification;

            throw error;

        }


        // ====================================================
        // CHECK-OUT POLICY
        // ====================================================

        const policyDecision =
            evaluateCheckOutPolicy({

                policy,

                serverTime

            });


        // ====================================================
        // CREATE CHECK-OUT
        // ====================================================

        const attendance =
            await createCheckOut({

                facultyId,

                verification,

                serverTime,

                earlyExit:
                    policyDecision.earlyExit

            });


        // ====================================================
        // AUDIT — SUCCESS
        // ====================================================

        try {

            await recordAttendanceSuccess({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .CHECK_OUT_SUCCESS,

                facultyId,

                attendanceId:
                    attendance.attendanceId

            });

        } catch (auditError) {

            console.error(

                "Failed to record check-out success audit:",

                auditError

            );

        }


        // ====================================================
        // RESPONSE
        // ====================================================

        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "ATTENDANCE_CHECK_OUT_SUCCESS",

                message:
                    "Attendance checked out successfully.",

                attendance,

                verification,

                policy: {

                    earlyExit:
                        policyDecision.earlyExit,

                    state:
                        policyDecision.policyState,

                    reason:
                        policyDecision.reason

                }

            });


    } catch (error) {

        // ====================================================
        // AUDIT — FAILURE
        // ====================================================

        try {

            await recordAttendanceFailure({

                actorId,

                actorRole,

                action:
                    AUDIT_ACTIONS
                        .CHECK_OUT_FAILED,

                facultyId,

                reason:
                    error.message ||
                    "Check-out failed."

            });

        } catch (auditError) {

            console.error(

                "Failed to record check-out failure audit:",

                auditError

            );

        }


        next(error);

    }

}