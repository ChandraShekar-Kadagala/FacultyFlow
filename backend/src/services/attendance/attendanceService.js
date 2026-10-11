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


// ============================================================
// GET SERVER DATE
// ============================================================

function getServerDate(
    serverTime = new Date()
) {

    return serverTime
        .toISOString()
        .slice(0, 10);
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


    return AttendanceRecord.findOne({

        facultyId,

        date:
            getServerDate()

    });
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


    return AttendanceRecord
        .find({
            facultyId
        })
        .sort({
            date: -1
        });
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

            facultyId

        });


    if (!faculty) {

        throw createAttendanceError(

            "Faculty member was not found.",

            ATTENDANCE_ERROR_CODES
                .FACULTY_NOT_FOUND,

            404

        );
    }


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

            facultyId,

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
        `ATT-${facultyId}-${date}`;


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

            facultyId,

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


    return attendance;
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


    const attendance =
        await AttendanceRecord.findOne({

            facultyId,

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
    // SAVE CHECK-OUT
    // ========================================================

    attendance.checkOutTime =
        serverTime;


    // ========================================================
    // EARLY EXIT
    // ========================================================

    if (
        earlyExit
    ) {

        attendance.status =
            "Incomplete";
    }


    attendance.verificationStatus =
        "Verified";


    // ========================================================
    // VERIFICATION SESSION
    // ========================================================

    if (
        verification.verificationSessionId
    ) {

        attendance.verificationSessionId =
            verification.verificationSessionId;
    }


    if (syncEventId) {
        attendance.syncEventId = syncEventId;
        attendance.checkOutSyncEventId = syncEventId;
    }

    await attendance.save();


    return attendance;
}