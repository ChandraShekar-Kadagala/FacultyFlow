// ============================================================
// FACULTYFLOW SYNC API
// ============================================================


const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL;


export async function syncAttendanceEvent(

    event,

    accessToken

) {

    // ========================================================
    // API URL CHECK
    // ========================================================

    if (!API_BASE_URL) {

        throw new Error(
            "EXPO_PUBLIC_API_URL is not configured."
        );

    }


    // ========================================================
    // AUTH CHECK
    // ========================================================

    if (!accessToken) {

        throw new Error(
            "Authentication session is missing."
        );

    }


    // ========================================================
    // SEND EVENT
    // ========================================================

    let response;


    try {

        response =
            await fetch(

                `${API_BASE_URL}/sync/events`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${accessToken}`

                    },

                    body:
                        JSON.stringify({

                            eventId:
                                event.eventId,

                            eventType:
                                event.eventType,

                            facultyId:
                                event.facultyId,

                            attendance:
                                event.attendance,

                            verification:
                                event.verification,

                            createdAt:
                                event.createdAt

                        })

                }

            );

    } catch (error) {

        const networkError =
            new Error(
                "Unable to connect to the FacultyFlow server."
            );


        networkError.code =
            "NETWORK_ERROR";


        networkError.status =
            0;


        throw networkError;

    }


    // ========================================================
    // READ RESPONSE
    // ========================================================

    let data = null;


    const contentType =
        response.headers.get(
            "content-type"
        );


    if (
        contentType &&
        contentType.includes(
            "application/json"
        )
    ) {

        data =
            await response.json();

    } else {

        const text =
            await response.text();


        data =
            text
                ? {
                    message:
                        text
                }
                : null;

    }


    // ========================================================
    // SERVER ERROR
    // ========================================================

    if (!response.ok) {

        const error =
            new Error(

                data?.message ||

                `Sync request failed with status ${response.status}.`

            );


        error.status =
            response.status;


        error.code =
            data?.code ||
            "SYNC_REQUEST_FAILED";


        error.data =
            data;


        throw error;

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return data;

}