import apiRequest from "../api/apiClient";


export async function loginUser(
    email,
    password
) {

    return apiRequest(
        "/auth/login",
        {
            method: "POST",

            body: {
                email,
                password
            }
        }
    );
}


export async function getCurrentUser(
    token
) {

    return apiRequest(
        "/auth/me",
        {
            method: "GET",
            token
        }
    );
}