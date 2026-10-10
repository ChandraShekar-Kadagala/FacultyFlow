import apiRequest
    from "../api/apiClient";


// ============================================================
// GET TODAY
// ============================================================

export async function getTodayAttendance(
    accessToken
) {

    return apiRequest(
        "/attendance/today",
        {
            method: "GET",
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

    return apiRequest(
        "/attendance/history",
        {
            method: "GET",
            accessToken
        }
    );

}


// ============================================================
// CHECK-IN
// ============================================================

export async function checkInAttendance({

    accessToken,

    device = null,

    network = null,

    location = null

}) {

    return apiRequest(
        "/attendance/check-in",
        {

            method:
                "POST",

            accessToken,

            body: {

                device,

                network,

                location

            }

        }
    );

}


// ============================================================
// CHECK-OUT
// ============================================================

export async function checkOutAttendance({

    accessToken,

    device = null,

    network = null,

    location = null

}) {

    return apiRequest(
        "/attendance/check-out",
        {

            method:
                "POST",

            accessToken,

            body: {

                device,

                network,

                location

            }

        }
    );

}