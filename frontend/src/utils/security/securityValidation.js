import {
    USER_ROLES
} from "./securityConstants";


export function isValidRole(role) {
    return (
        role === USER_ROLES.ADMIN ||
        role === USER_ROLES.FACULTY
    );
}


export function isAdmin(user) {
    return (
        Boolean(user) &&
        user.role === USER_ROLES.ADMIN
    );
}


export function isFaculty(user) {
    return (
        Boolean(user) &&
        user.role === USER_ROLES.FACULTY
    );
}


export function hasRequiredRole(
    user,
    requiredRole
) {
    if (!user) {
        return false;
    }

    if (!isValidRole(requiredRole)) {
        return false;
    }

    return user.role === requiredRole;
}


export function validateAuthenticatedUser(
    user
) {
    if (!user) {
        return {
            valid: false,
            reason: "USER_NOT_AUTHENTICATED"
        };
    }

    if (!isValidRole(user.role)) {
        return {
            valid: false,
            reason: "INVALID_ROLE"
        };
    }

    return {
        valid: true,
        reason: null
    };
}