// ============================================================
// ATTENDANCE ERROR FACTORY
// ============================================================

export function createAttendanceError(
    message,
    code,
    statusCode = 400
) {

    const error = new Error(message);

    error.code = code;

    error.statusCode = statusCode;

    error.isOperational = true;

    return error;
}


// ============================================================
// ATTENDANCE ERROR CODES
// ============================================================

export const ATTENDANCE_ERROR_CODES = {

    FACULTY_ID_REQUIRED:
        "FACULTY_ID_REQUIRED",

    FACULTY_NOT_FOUND:
        "FACULTY_NOT_FOUND",

    FACULTY_INACTIVE:
        "FACULTY_INACTIVE",

    ATTENDANCE_ALREADY_EXISTS:
        "ATTENDANCE_ALREADY_EXISTS",

    CHECK_IN_REQUIRED:
        "CHECK_IN_REQUIRED",

    CHECK_OUT_ALREADY_COMPLETED:
        "CHECK_OUT_ALREADY_COMPLETED",

    ATTENDANCE_NOT_FOUND:
        "ATTENDANCE_NOT_FOUND",

    INVALID_ATTENDANCE_REQUEST:
        "INVALID_ATTENDANCE_REQUEST",

         VERIFICATION_REQUIRED:
        "VERIFICATION_REQUIRED",

    VERIFICATION_FAILED:
        "VERIFICATION_FAILED"

};