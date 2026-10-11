import SyncEvent
    from "../../models/SyncEvent.js";

import AttendanceRecord
    from "../../models/AttendanceRecord.js";


import Faculty
    from "../../models/Faculty.js";


import {
    createCheckIn,
    createCheckOut
} from "../attendance/attendanceService.js";


import {
    runVerificationEngine
} from "../verification/verificationEngine.js";


import {
    getActiveAttendancePolicy,
    getRequiredVerificationTypes,
    evaluateCheckInPolicy,
    evaluateCheckOutPolicy
} from "../attendance/policyService.js";


function createSyncError(

    message,

    code,

    statusCode = 400

) {

    const error =
        new Error(message);


    error.code =
        code;


    error.statusCode =
        statusCode;


    return error;

}


// ============================================================
// VALIDATE EVENT
// ============================================================

function validateEvent(event) {

    if (!event?.eventId) {

        throw createSyncError(

            "Sync event ID is required.",

            "SYNC_EVENT_ID_REQUIRED"

        );

    }


    if (!event?.eventType) {

        throw createSyncError(

            "Sync event type is required.",

            "SYNC_EVENT_TYPE_REQUIRED"

        );

    }


    if (
        ![
            "CHECK_IN",
            "CHECK_OUT"
        ].includes(
            event.eventType
        )
    ) {

        throw createSyncError(

            "Unsupported sync event type.",

            "SYNC_EVENT_TYPE_INVALID"

        );

    }

}


// ============================================================
// CHECK DUPLICATE
// ============================================================

export async function findExistingSyncEvent(
    eventId
) {

    return SyncEvent.findOne({

        eventId

    });

}
function handleExistingSyncEvent(existingEvent, facultyId) {
    if (existingEvent.facultyId !== facultyId) {
        throw createSyncError(
            "Sync event ID conflict.",
            "SYNC_EVENT_ID_CONFLICT",
            409
        );
    }

    if (existingEvent.status === "PROCESSED") {
        return {
            duplicate: true,
            syncEvent: existingEvent,
            attendanceId: existingEvent.attendanceId,
            code: "SYNC_EVENT_DUPLICATE",
            message: "Sync event was already processed."
        };
    }

    if (existingEvent.status === "FAILED") {
        throw createSyncError(
            "This event previously failed and needs recovery.",
            "SYNC_EVENT_REQUIRES_RECOVERY",
            409
        );
    }

    if (existingEvent.status === "RECEIVED") {
        return handleReceivedSyncEvent(existingEvent);
    }

    throw createSyncError(
        "This event is unfinished. Retry after recovery.",
        "SYNC_EVENT_NOT_FINISHED",
        503
    );
}

async function handleReceivedSyncEvent(existingEvent) {
    const attendance = await AttendanceRecord.findOne({
        $or: [
            { syncEventId: existingEvent.eventId },
            { checkInSyncEventId: existingEvent.eventId },
            { checkOutSyncEventId: existingEvent.eventId }
        ]
    });

    if (attendance) {
        existingEvent.status = "PROCESSED";
        existingEvent.attendanceId = attendance.attendanceId;
        existingEvent.resultCode = existingEvent.eventType === "CHECK_IN" ? "ATTENDANCE_CHECK_IN_SUCCESS" : "ATTENDANCE_CHECK_OUT_SUCCESS";
        existingEvent.resultMessage = "Recovered from interrupted processing.";
        existingEvent.processedAt = new Date();
        await existingEvent.save();

        return {
            duplicate: true,
            syncEvent: existingEvent,
            attendanceId: attendance.attendanceId,
            code: "SYNC_EVENT_RECOVERED",
            message: "Sync event recovered and marked as processed."
        };
    }

    return {
        reprocessing: true
    };
}


// ============================================================
// PROCESS CHECK-IN
// ============================================================

async function processCheckIn({

    faculty,

    user,

    event

}) {

    // --------------------------------------------------------
    // Server time is authoritative.
    // --------------------------------------------------------

    const serverTime =
        new Date();


    // --------------------------------------------------------
    // Load active policy
    // --------------------------------------------------------

    const policy =
        await getActiveAttendancePolicy();


    const requiredTypes =
        getRequiredVerificationTypes(
            policy
        );


    // --------------------------------------------------------
    // Client signals are observations only.
    // --------------------------------------------------------

    const deviceSignal =
        event?.device ||
        null;


    const networkSignal =
        event?.network ||
        null;


    const locationSignal =
        event?.location ||
        null;


    // --------------------------------------------------------
    // Run server verification
    // --------------------------------------------------------

    const verification =
        await runVerificationEngine({

            user,

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


    if (
        verification.result ===
        "FAILED"
    ) {

        throw createSyncError(

            verification.reason ||
            "Attendance verification failed.",

            "ATTENDANCE_VERIFICATION_FAILED",

            403

        );

    }


    if (
        verification.result !==
        "VERIFIED"
    ) {

        throw createSyncError(

            verification.reason ||
            "Attendance verification is incomplete.",

            "ATTENDANCE_VERIFICATION_INCOMPLETE",

            403

        );

    }


    // --------------------------------------------------------
    // Attendance time policy
    // --------------------------------------------------------

    const policyDecision =
        evaluateCheckInPolicy({

            policy,

            serverTime

        });


    if (
        !policyDecision.allowed
    ) {

        throw createSyncError(

            policyDecision.reason,

            "ATTENDANCE_OUTSIDE_ALLOWED_TIME",

            403

        );

    }


    // --------------------------------------------------------
    // Create authoritative attendance
    // --------------------------------------------------------

    const attendance =
        await createCheckIn({

            facultyId:
                faculty.facultyId,

            verification,

            serverTime,
            attendanceStatus:
                policyDecision.status,
            syncEventId: event.eventId

        });


    return {

        attendance,

        verification,

        policyDecision

    };

}


// ============================================================
// PROCESS CHECK-OUT
// ============================================================

async function processCheckOut({

    faculty,

    user,

    event

}) {

    const serverTime =
        new Date();


    const policy =
        await getActiveAttendancePolicy();


    const requiredTypes =
        getRequiredVerificationTypes(
            policy
        );


    const deviceSignal =
        event?.device ||
        null;


    const networkSignal =
        event?.network ||
        null;


    const locationSignal =
        event?.location ||
        null;


    // --------------------------------------------------------
    // Server-side verification
    // --------------------------------------------------------

    const verification =
        await runVerificationEngine({

            user,

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


    if (
        verification.result ===
        "FAILED"
    ) {

        throw createSyncError(

            verification.reason ||
            "Check-out verification failed.",

            "ATTENDANCE_VERIFICATION_FAILED",

            403

        );

    }


    if (
        verification.result !==
        "VERIFIED"
    ) {

        throw createSyncError(

            verification.reason ||
            "Check-out verification is incomplete.",

            "ATTENDANCE_VERIFICATION_INCOMPLETE",

            403

        );

    }


    // --------------------------------------------------------
    // Check-out policy
    // --------------------------------------------------------

    const policyDecision =
        evaluateCheckOutPolicy({

            policy,

            serverTime

        });


    // --------------------------------------------------------
    // Create authoritative checkout
    // --------------------------------------------------------

    const attendance =
        await createCheckOut({

            facultyId:
                faculty.facultyId,

            verification,

            serverTime,
            earlyExit:
                policyDecision.earlyExit,
            syncEventId: event.eventId

        });


    return {

        attendance,

        verification,

        policyDecision

    };

}


// ============================================================
// PROCESS SYNC EVENT
// ============================================================

export async function processSyncEvent({

    event,

    user

}) {

    validateEvent(event);


    if (!user?.userId) {

        throw createSyncError(

            "Authenticated user is required.",

            "AUTHENTICATION_REQUIRED",

            401

        );

    }


    if (!user?.facultyId) {

        throw createSyncError(

            "Authenticated faculty profile is unavailable.",

            "FACULTY_PROFILE_UNAVAILABLE",

            400

        );

    }


    // ========================================================
    // FACULTY FROM SERVER
    // ========================================================

    const faculty =
        await Faculty.findOne({

            facultyId:
                user.facultyId

        });


    if (!faculty) {

        throw createSyncError(

            "Faculty profile was not found.",

            "FACULTY_NOT_FOUND",

            404

        );

    }


    // ========================================================
    // EXISTING EVENT
    // ========================================================
const existingEvent = await findExistingSyncEvent(
    event.eventId
);

let syncRecord;

if (existingEvent) {
    const handleResult = await handleExistingSyncEvent(
        existingEvent,
        user.facultyId
    );
    if (handleResult.duplicate || handleResult.code === "SYNC_EVENT_RECOVERED") {
        return handleResult;
    }
    // If it returns { reprocessing: true }, we use the existing event.
    syncRecord = existingEvent;
} else {
    try {
        syncRecord =
            await SyncEvent.create({
                eventId:
                    event.eventId,
                eventType:
                    event.eventType,
                facultyId:
                    user.facultyId,
                clientCreatedAt:
                    event.createdAt
                        ? new Date(event.createdAt)
                        : null,
                status:
                    "RECEIVED"
            });
    } catch (error) {
        if (error?.code === 11000) {
            const duplicate = await findExistingSyncEvent(
                event.eventId
            );
            if (!duplicate) {
                throw error;
            }
            const handleResult = await handleExistingSyncEvent(
                duplicate,
                user.facultyId
            );
            if (handleResult.duplicate || handleResult.code === "SYNC_EVENT_RECOVERED") {
                return handleResult;
            }
            syncRecord = duplicate;
        } else {
            throw error;
        }
    }
}


    // ========================================================
    // PROCESS EVENT
    // ========================================================

    try {

        let result;


        if (
            event.eventType ===
            "CHECK_IN"
        ) {

            result =
                await processCheckIn({

                    faculty,

                    user,

                    event

                });

        } else {

            result =
                await processCheckOut({

                    faculty,

                    user,

                    event

                });

        }


        // ----------------------------------------------------
        // Mark processed
        // ----------------------------------------------------

        syncRecord.status =
            "PROCESSED";


        syncRecord.attendanceId =
            result
                .attendance
                ?.attendanceId ||
            null;


        syncRecord.resultCode =
            event.eventType ===
            "CHECK_IN"

                ? "ATTENDANCE_CHECK_IN_SUCCESS"

                : "ATTENDANCE_CHECK_OUT_SUCCESS";


        syncRecord.resultMessage =
            event.eventType ===
            "CHECK_IN"

                ? "Check-in synchronized successfully."

                : "Check-out synchronized successfully.";


        syncRecord.processedAt =
            new Date();


        await syncRecord.save();


        return {

            duplicate:
                false,

            code:
                "SYNC_EVENT_PROCESSED",

            message:
                syncRecord.resultMessage,

            syncEvent:
                syncRecord,

            attendance:
                result.attendance,

            verification:
                result.verification,

            policy:
                result.policyDecision

        };

    } catch (error) {

        // ----------------------------------------------------
        // Save failure for audit/debugging.
        // ----------------------------------------------------

        syncRecord.status =
            "FAILED";


        syncRecord.errorCode =
            error?.code ||
            "SYNC_PROCESSING_FAILED";


        syncRecord.resultMessage =
            error?.message ||
            "Sync event processing failed.";


        syncRecord.processedAt =
            new Date();


        await syncRecord.save();


        throw error;

    }

}