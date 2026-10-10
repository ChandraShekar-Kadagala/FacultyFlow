import {
    isValidRole
} from "../../utils/security/securityValidation";


export function validateUserSession(
    user
) {
    if (!user) {
        return {
            authenticated: false,
            authorized: false,
            reason:
                "USER_NOT_AUTHENTICATED"
        };
    }

    if (!isValidRole(user.role)) {
        return {
            authenticated: true,
            authorized: false,
            reason:
                "INVALID_ROLE"
        };
    }

    if (
        user.status &&
        user.status !== "active"
    ) {
        return {
            authenticated: true,
            authorized: false,
            reason:
                "USER_INACTIVE"
        };
    }

    return {
        authenticated: true,
        authorized: true,
        reason: null
    };
}


export function canAccessAdmin(
    user
) {
    const session =
        validateUserSession(
            user
        );

    return (
        session.authenticated &&
        session.authorized &&
        user.role === "admin"
    );
}


export function canAccessFaculty(
    user
) {
    const session =
        validateUserSession(
            user
        );

    return (
        session.authenticated &&
        session.authorized &&
        user.role === "faculty"
    );
}