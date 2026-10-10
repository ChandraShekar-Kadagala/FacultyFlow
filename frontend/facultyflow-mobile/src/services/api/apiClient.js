const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL;


async function apiRequest(
    endpoint,
    options = {}
) {

    if (!API_BASE_URL) {

        const error =
            new Error(
                "EXPO_PUBLIC_API_URL is not configured."
            );

        error.code =
            "API_URL_NOT_CONFIGURED";

        throw error;

    }


    const {
        method = "GET",
        body,
        accessToken,
        headers = {}
    } = options;


    const requestHeaders = {

        "Content-Type":
            "application/json",

        ...headers

    };


    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (accessToken) {

        requestHeaders.Authorization =
            `Bearer ${accessToken}`;

    }


    const requestOptions = {

        method,

        headers:
            requestHeaders

    };


    if (
        body !== undefined &&
        body !== null
    ) {

        requestOptions.body =
            JSON.stringify(body);

    }


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

        throw networkError;

    }


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


    return data;

}


export default apiRequest;