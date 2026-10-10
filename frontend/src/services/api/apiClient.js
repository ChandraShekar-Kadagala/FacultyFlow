import API_BASE_URL from "./apiConfig";


// ============================================================
// CENTRAL API CLIENT
// ============================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const {
        method = "GET",
        body,
        token,
        headers = {}
    } = options;


    // ========================================================
    // REQUEST CONFIGURATION
    // ========================================================

    const requestHeaders = {

        "Content-Type":
            "application/json",

        ...headers

    };


    // ========================================================
    // AUTHORIZATION
    // ========================================================

    if (token) {

        requestHeaders.Authorization =
            `Bearer ${token}`;

    }


    // ========================================================
    // REQUEST OPTIONS
    // ========================================================

    const requestOptions = {

        method,

        headers:
            requestHeaders

    };


    // ========================================================
    // REQUEST BODY
    // ========================================================

    if (
        body !== undefined &&
        body !== null
    ) {

        requestOptions.body =
            JSON.stringify(body);

    }


    // ========================================================
    // SEND REQUEST
    // ========================================================

    let response;

    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                requestOptions
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

        networkError.data =
            null;

        throw networkError;

    }


    // ========================================================
    // PARSE RESPONSE
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
                ? { message: text }
                : null;

    }


    // ========================================================
    // HANDLE API ERRORS
    // ========================================================

    if (!response.ok) {

        const error =
            new Error(
                data?.message ||
                `Request failed with status ${response.status}.`
            );


        error.status =
            response.status;


        error.code =
            data?.code ||
            "API_REQUEST_FAILED";


        error.data =
            data;


        throw error;

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return data;

}


export default apiRequest;