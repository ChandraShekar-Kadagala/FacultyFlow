const TOKEN_KEY =
    "facultyflow_access_token";


const USER_KEY =
    "facultyflow_auth_user";


export function saveAuthSession(
    accessToken,
    user
) {

    sessionStorage.setItem(
        TOKEN_KEY,
        accessToken
    );

    sessionStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
    );
}


export function getAccessToken() {

    return sessionStorage.getItem(
        TOKEN_KEY
    );
}


export function getStoredUser() {

    try {

        const storedUser =
            sessionStorage.getItem(
                USER_KEY
            );

        return storedUser
            ? JSON.parse(storedUser)
            : null;

    } catch {

        sessionStorage.removeItem(
            USER_KEY
        );

        return null;
    }
}


export function clearAuthSession() {

    sessionStorage.removeItem(
        TOKEN_KEY
    );

    sessionStorage.removeItem(
        USER_KEY
    );
}