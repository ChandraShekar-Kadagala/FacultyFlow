import apiRequest
    from "../api/apiClient";


// ============================================================
// GET ACTIVE LOCATION
// ============================================================

export async function getActiveCampusLocation(
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

        "/admin/locations/active",

        {

            method:
                "GET",

            token:
                accessToken

        }

    );

}


// ============================================================
// GET ALL
// ============================================================

export async function getCampusLocations(
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

        "/admin/locations",

        {

            method:
                "GET",

            token:
                accessToken

        }

    );

}


// ============================================================
// CREATE
// ============================================================

export async function createCampusLocation(

    location,

    accessToken

) {

    return await apiRequest(

        "/admin/locations",

        {

            method:
                "POST",

            body:
                location,

            token:
                accessToken

        }

    );

}


// ============================================================
// UPDATE
// ============================================================

export async function updateCampusLocation(

    locationId,

    location,

    accessToken

) {

    return await apiRequest(

        `/admin/locations/${encodeURIComponent(
            locationId
        )}`,

        {

            method:
                "PUT",

            body:
                location,

            token:
                accessToken

        }

    );

}


// ============================================================
// ACTIVATE
// ============================================================

export async function activateCampusLocation(

    locationId,

    accessToken

) {

    return await apiRequest(

        `/admin/locations/${encodeURIComponent(
            locationId
        )}/activate`,

        {

            method:
                "PATCH",

            token:
                accessToken

        }

    );

}


// ============================================================
// DEACTIVATE
// ============================================================

export async function deactivateCampusLocation(

    locationId,

    accessToken

) {

    return await apiRequest(

        `/admin/locations/${encodeURIComponent(
            locationId
        )}/deactivate`,

        {

            method:
                "PATCH",

            token:
                accessToken

        }

    );

}
export async function toggleCampusLocation(locationId, currentActive, accessToken) {
    if (currentActive) {
        return await deactivateCampusLocation(locationId, accessToken);
    }
    return await activateCampusLocation(locationId, accessToken);
}

export async function deleteCampusLocation(locationId, accessToken) {
    return await apiRequest(
        `/admin/locations/${encodeURIComponent(locationId)}`,
        {
            method: "DELETE",
            token: accessToken
        }
    );
}

export async function resetCampusLocations(accessToken) {
    return await getCampusLocations(accessToken);
}
