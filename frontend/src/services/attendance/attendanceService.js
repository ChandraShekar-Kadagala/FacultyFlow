import apiRequest
    from "../api/apiClient";


// ============================================================
// GET TODAY
// ============================================================

export async function getTodayAttendance(
    accessToken
) {

    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(

        "/attendance/today",

        {

            method:
                "GET",

            token:
                accessToken

        }

    );

}


// ============================================================
// GET HISTORY
// ============================================================

export async function getAttendanceHistory(
    accessToken
) {

    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(

        "/attendance/history",

        {

            method:
                "GET",

            token:
                accessToken

        }

    );

}


// ============================================================
// CHECK-IN
// ============================================================

export async function checkInAttendance(

    location,

    accessToken

) {

    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(

        "/attendance/check-in",

        {

            method:
                "POST",

            body: {

                location

            },

            token:
                accessToken

        }

    );

}


// ============================================================
// CHECK-OUT
// ============================================================

export async function checkOutAttendance(

    location,

    accessToken

) {

    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(

        "/attendance/check-out",

        {

            method:
                "POST",

            body: {

                location

            },

            token:
                accessToken

        }

    );

}