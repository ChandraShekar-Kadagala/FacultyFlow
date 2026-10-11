import { apiRequest } from "../api/apiClient.js";


// ============================================================
// LOGIN
// ============================================================

export async function loginUser({
    email,
    password
}) {

    // ========================================================
    // VALIDATE INPUT
    // ========================================================

    if (
        !email ||
        !password
    ) {

        const error =
            new Error(
                "Email and password are required."
            );

        error.code =
            "LOGIN_INPUT_REQUIRED";

        throw error;

    }


    // ========================================================
    // SEND LOGIN REQUEST
    // ========================================================

    const data =
        await apiRequest(
            "/auth/login",
            {

                method:
                    "POST",

                body: {

                    email:
                        email.trim(),

                    password

                }

            }
        );


    // ========================================================
    // VALIDATE SERVER RESPONSE
    // ========================================================

    if (
        !data?.accessToken ||
        !data?.user
    ) {

        const error =
            new Error(
                "Invalid login response from server."
            );

        error.code =
            "INVALID_LOGIN_RESPONSE";

        error.data =
            data;

        throw error;

    }


    // ========================================================
    // RETURN AUTHENTICATION DATA
    // ========================================================

    return data;

}