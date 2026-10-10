import apiRequest
    from "../api/apiClient";


export async function getFacultyList(
    token
) {

    return apiRequest(
        "/faculty",
        {
            method: "GET",
            token
        }
    );

}


export async function getFacultyById(
    facultyId,
    token
) {

    return apiRequest(
        `/faculty/${facultyId}`,
        {
            method: "GET",
            token
        }
    );

}


export async function createFaculty(
    facultyData,
    token
) {

    return apiRequest(
        "/faculty",
        {
            method: "POST",
            token,
            body: facultyData
        }
    );

}


export async function updateFaculty(
    facultyId,
    facultyData,
    token
) {

    return apiRequest(
        `/faculty/${facultyId}`,
        {
            method: "PATCH",
            token,
            body: facultyData
        }
    );

}


export async function deactivateFaculty(
    facultyId,
    token
) {

    return apiRequest(
        `/faculty/${facultyId}/deactivate`,
        {
            method: "PATCH",
            token
        }
    );

}