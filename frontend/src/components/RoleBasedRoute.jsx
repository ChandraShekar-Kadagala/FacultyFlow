import {
    Navigate,
    useLocation
} from "react-router-dom";

import useAuth
    from "../hooks/useAuth";

import {
    hasRequiredRole
} from "../utils/security/securityValidation";

import {
    recordSecurityEvent
} from "../services/security/securityAudit";

import {
    SECURITY_EVENTS,
    SECURITY_RESULTS
} from "../utils/security/securityConstants";


function RoleBasedRoute({
    allowedRole,
    allowedRoles,
    children
}) {
    const {
        user
    } = useAuth();

    const location =
        useLocation();

    const targetRoles =
        allowedRoles ||
        (Array.isArray(allowedRole)
            ? allowedRole
            : allowedRole
                ? [allowedRole]
                : []);

    const allowed =
        hasRequiredRole(
            user,
            targetRoles.length === 1
                ? targetRoles[0]
                : targetRoles
        );

    if (!allowed) {

        recordSecurityEvent({
            eventType:
                SECURITY_EVENTS
                    .ADMIN_ACCESS_DENIED,

            result:
                SECURITY_RESULTS
                    .DENIED,

            actorId:
                user?.id || user?.userId,

            route:
                location.pathname,

            reason:
                `Required role(s): ${targetRoles.join(", ")}`
        });

        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }

    recordSecurityEvent({
        eventType:
            SECURITY_EVENTS
                .ADMIN_ACCESS_GRANTED,

        result:
            SECURITY_RESULTS
                .SUCCESS,

        actorId:
            user?.id || user?.userId,

        route:
            location.pathname,

        reason:
            `Role verified: ${user?.role}`
    });

    return children;
}

export default RoleBasedRoute;