import AttendanceRecord
    from "../../models/AttendanceRecord.js";

import Faculty
    from "../../models/Faculty.js";

import {
    createAttendanceError,
    ATTENDANCE_ERROR_CODES
} from "../../utils/attendance/attendanceErrors.js";

import {
    VERIFICATION_RESULTS
} from "../verification/verificationConstants.js";

import {
    calculateWorkingDuration
} from "../../utils/attendance/durationUtils.js";

import {
    reconcileOverdueSessions
} from "./attendanceReconciliationService.js";


// ============================================================
// FORMAT ATTENDANCE RECORD WITH DURATION
// ============================================================

export function formatAttendanceRecord(record) {
    if (!record) return null;
    const doc = record.toObject ? record.toObject() : { ...record };
    if (doc.checkInTime) {
        const duration = calculateWorkingDuration(doc.checkInTime, doc.checkOutTime);
        doc.workingDurationMinutes = doc.workingDurationMinutes ?? (doc.checkOutTime ? duration.minutes : null);
        doc.workingDurationFormatted = doc.workingDurationFormatted || (doc.checkOutTime ? duration.formatted : null);
        doc.workingDurationCompact = duration.formattedCompact;
        doc.isOngoing = duration.isOngoing;
        doc.elapsedMinutes = duration.minutes;
        doc.elapsedFormatted = duration.formatted;
    } else {
        doc.workingDurationMinutes = null;
        doc.workingDurationFormatted = "—";
        doc.workingDurationCompact = "—";
        doc.isOngoing = false;
        doc.elapsedMinutes = 0;
        doc.elapsedFormatted = "—";
    }
    return doc;
}


// ============================================================
// GET SERVER DATE (TIMEZONE AWARE)
// ============================================================

function getServerDate(
    serverTime = new Date(),
    timezone = "Asia/Kolkata"
) {

    try {

        return new Intl.DateTimeFormat("en-CA", {

            timeZone: timezone || "Asia/Kolkata",

            year: "numeric",

            month: "2-digit",

            day: "2-digit"

        }).format(serverTime);

    } catch (_err) {

        return serverTime
            .toISOString()
            .slice(0, 10);

    }

}


// ============================================================
// GET TODAY ATTENDANCE
// ============================================================

export async function getTodayAttendance(
    facultyId
) {

    if (!facultyId) {

        throw createAttendanceError(

            "Faculty ID is required.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_ID_REQUIRED,

            400

        );
    }

    const faculty = await Faculty.findOne({
        $or: [
            { facultyId },
            { userId: facultyId }
        ]
    });
    const canonicalId = faculty ? faculty.facultyId : facultyId;

    // Automatically reconcile any overdue open sessions from previous days
    await reconcileOverdueSessions({ facultyId: canonicalId }).catch(err => {
        console.warn("Session reconciliation error during getTodayAttendance:", err.message);
    });

    const record = await AttendanceRecord.findOne({

        facultyId: { $in: [canonicalId, facultyId] },

        date:
            getServerDate()

    });

    return formatAttendanceRecord(record);
}


// ============================================================
// GET ATTENDANCE HISTORY
// ============================================================

export async function getAttendanceHistory(
    facultyId
) {

    if (!facultyId) {

        throw createAttendanceError(

            "Faculty ID is required.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_ID_REQUIRED,

            400

        );
    }

    const faculty = await Faculty.findOne({
        $or: [
            { facultyId },
            { userId: facultyId }
        ]
    });
    const canonicalId = faculty ? faculty.facultyId : facultyId;

    // Automatically reconcile overdue open sessions before returning history
    await reconcileOverdueSessions({ facultyId: canonicalId }).catch(err => {
        console.warn("Session reconciliation error during getAttendanceHistory:", err.message);
    });

    const records = await AttendanceRecord
        .find({
            facultyId: { $in: [canonicalId, facultyId] }
        })
        .sort({
            date: -1,
            checkInTime: -1
        });

    return records.map(r => formatAttendanceRecord(r));
}


// ============================================================
// CREATE CHECK-IN
// ============================================================

export async function createCheckIn({

    facultyId,

    verification,

    serverTime = new Date(),
    attendanceStatus = "Present",
    syncEventId = null
} = {}) {


    // ========================================================
    // FACULTY ID
    // ========================================================

    if (!facultyId) {

        throw createAttendanceError(

            "Faculty ID is required.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_ID_REQUIRED,

            400

        );
    }


    // ========================================================
    // VERIFICATION REQUIRED
    // ========================================================

    if (!verification) {

        throw createAttendanceError(

            "Attendance verification is required.",

            ATTENDANCE_ERROR_CODES
                .VERIFICATION_REQUIRED,

            403

        );
    }


    if (
        verification.result !==
        VERIFICATION_RESULTS.VERIFIED
    ) {

        throw createAttendanceError(

            "Attendance verification failed.",

            ATTENDANCE_ERROR_CODES
                .VERIFICATION_FAILED,

            403

        );
    }


    // ========================================================
    // LOAD FACULTY
    // ========================================================

    const faculty =
        await Faculty.findOne({
            $or: [
                { facultyId },
                { userId: facultyId }
            ]
        });


    if (!faculty) {

        throw createAttendanceError(

            "Faculty member was not found.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_NOT_FOUND,

            404

        );
    }

    const canonicalFacultyId = faculty.facultyId;


    if (
        faculty.status !==
        "active"
    ) {

        throw createAttendanceError(

            "Faculty account is inactive.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_INACTIVE,

            403

        );
    }


    // ========================================================
    // DATE
    // ========================================================

    const date =
        getServerDate(
            serverTime
        );


    // ========================================================
    // DUPLICATE CHECK
    // ========================================================

    const existing =
        await AttendanceRecord.findOne({

            facultyId: { $in: [canonicalFacultyId, facultyId] },

            date

        });


    if (existing) {

        throw createAttendanceError(

            "Attendance has already been recorded for today.",

            ATTENDANCE_ERROR_CODES
                .ATTENDANCE_ALREADY_EXISTS,

            409

        );
    }


    // ========================================================
    // ATTENDANCE ID
    // ========================================================

    const attendanceId =
        `ATT-${canonicalFacultyId}-${date}`;


    // ========================================================
    // VERIFICATION EVENT
    // ========================================================

    const firstEvent =
        Array.isArray(
            verification.verificationEvents
        )
            ? verification
                .verificationEvents[0]
            : null;


    const verificationEventId =
        firstEvent
            ?.verificationEventId ||
        null;


    const verificationSessionId =
        verification
            .verificationSessionId ||
        null;


    // ========================================================
    // CREATE ATTENDANCE
    // ========================================================

    const attendance =
        await AttendanceRecord.create({

            attendanceId,

            facultyId: canonicalFacultyId,

            date,

            checkInTime:
                serverTime,

            checkOutTime:
                null,

            status:
                attendanceStatus,

            verificationStatus:
                "Verified",

            verificationEventId,

            verificationSessionId,

            syncStatus:
                "SYNCED",
            source:
                "WEB",
            syncEventId,
            checkInSyncEventId:
                syncEventId
        });


    return formatAttendanceRecord(attendance);
}


// ============================================================
// CREATE CHECK-OUT
// ============================================================

export async function createCheckOut({

    facultyId,

    verification,

    serverTime = new Date(),
    earlyExit = false,
    syncEventId = null
} = {}) {


    // ========================================================
    // FACULTY ID
    // ========================================================

    if (!facultyId) {

        throw createAttendanceError(

            "Faculty ID is required.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_ID_REQUIRED,

            400

        );
    }


    // ========================================================
    // VERIFICATION
    // ========================================================

    if (!verification) {

        throw createAttendanceError(

            "Attendance verification is required.",

            ATTENDANCE_ERROR_CODES
                .VERIFICATION_REQUIRED,

            403

        );
    }


    if (
        verification.result !==
        VERIFICATION_RESULTS.VERIFIED
    ) {

        throw createAttendanceError(

            "Attendance verification failed.",

            ATTENDANCE_ERROR_CODES
                .VERIFICATION_FAILED,

            403

        );
    }


    // ========================================================
    // FIND TODAY'S RECORD
    // ========================================================

    const date =
        getServerDate(
            serverTime
        );

    const faculty = await Faculty.findOne({
        $or: [
            { facultyId },
            { userId: facultyId }
        ]
    });
    const canonicalId = faculty ? faculty.facultyId : facultyId;

    const attendance =
        await AttendanceRecord.findOne({

            facultyId: { $in: [canonicalId, facultyId] },

            date

        });


    if (!attendance) {

        throw createAttendanceError(

            "Check-in is required before check-out.",

            ATTENDANCE_ERROR_CODES
                .CHECK_IN_REQUIRED,

            400

        );
    }


    // ========================================================
    // DUPLICATE CHECK-OUT
    // ========================================================

    if (
        attendance.checkOutTime
    ) {

        throw createAttendanceError(

            "Attendance has already been checked out.",

            ATTENDANCE_ERROR_CODES
                .CHECK_OUT_ALREADY_COMPLETED,

            409

        );
    }


    // ========================================================
    // SAVE CHECK-OUT & WORKING DURATION
    // ========================================================

    attendance.checkOutTime = serverTime;

    const duration = calculateWorkingDuration(attendance.checkInTime, serverTime);
    attendance.workingDurationMinutes = duration.minutes;
    attendance.workingDurationFormatted = duration.formatted;

    // ========================================================
    // STATUS (Completed or Incomplete if earlyExit)
    // ========================================================

    if (earlyExit) {
        attendance.status = "Incomplete";
    } else {
        attendance.status = "Completed";
    }

    attendance.verificationStatus = "Verified";

    // ========================================================
    // VERIFICATION SESSION
    // ========================================================

    if (verification.verificationSessionId) {
        attendance.verificationSessionId = verification.verificationSessionId;
    }

    if (syncEventId) {
        attendance.syncEventId = syncEventId;
        attendance.checkOutSyncEventId = syncEventId;
    }

    await attendance.save();

    return formatAttendanceRecord(attendance);
}