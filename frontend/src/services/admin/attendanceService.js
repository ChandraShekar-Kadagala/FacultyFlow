import apiRequest
    from "../api/apiClient";


// ============================================================
// GET ADMIN ATTENDANCE
// ============================================================

export async function getAdminAttendance(
    token,
    filters = {}
) {

    const queryParams =
        new URLSearchParams();


    // --------------------------------------------------------
    // FACULTY ID
    // --------------------------------------------------------

    if (filters.facultyId) {

        queryParams.set(
            "facultyId",
            filters.facultyId
        );

    }


    // --------------------------------------------------------
    // EXACT DATE
    // --------------------------------------------------------

    if (filters.date) {

        queryParams.set(
            "date",
            filters.date
        );

    }


    // --------------------------------------------------------
    // START DATE
    // --------------------------------------------------------

    if (filters.startDate) {

        queryParams.set(
            "startDate",
            filters.startDate
        );

    }


    // --------------------------------------------------------
    // END DATE
    // --------------------------------------------------------

    if (filters.endDate) {

        queryParams.set(
            "endDate",
            filters.endDate
        );

    }


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (
        filters.status &&
        filters.status !== "ALL"
    ) {

        queryParams.set(
            "status",
            filters.status
        );

    }


    // --------------------------------------------------------
    // VERIFICATION STATUS
    // --------------------------------------------------------

    if (
        filters.verificationStatus &&
        filters.verificationStatus !== "ALL"
    ) {

        queryParams.set(
            "verificationStatus",
            filters.verificationStatus
        );

    }


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (filters.search) {

        queryParams.set(
            "search",
            filters.search
        );

    }


    const queryString =
        queryParams.toString();


    const endpoint =
        queryString
            ? `/admin/attendance?${queryString}`
            : "/admin/attendance";


    return apiRequest(
        endpoint,
        {
            method: "GET",
            token
        }
    );

}


// ============================================================
// GET SINGLE ATTENDANCE
// ============================================================

export async function getAdminAttendanceById(
    attendanceId,
    token
) {

    if (!attendanceId) {

        throw new Error(
            "Attendance ID is required."
        );

    }


    return apiRequest(
        `/admin/attendance/${attendanceId}`,
        {
            method: "GET",
            token
        }
    );

}


// ============================================================
// GET FACULTY ATTENDANCE
// ============================================================

export async function getFacultyAttendance(
    facultyId,
    token
) {

    if (!facultyId) {

        throw new Error(
            "Faculty ID is required."
        );

    }


    return apiRequest(
        `/admin/attendance/faculty/${facultyId}`,
        {
            method: "GET",
            token
        }
    );

}


// ============================================================
// GET ATTENDANCE BY DATE
// ============================================================

export async function getAttendanceByDate(
    date,
    token
) {

    if (!date) {

        throw new Error(
            "Attendance date is required."
        );

    }


    return apiRequest(
        `/admin/attendance/date/${date}`,
        {
            method: "GET",
            token
        }
    );

}