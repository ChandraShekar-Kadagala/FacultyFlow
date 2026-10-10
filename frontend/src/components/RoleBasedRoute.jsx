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
    children
}) {
    const {
        user
    } = useAuth();

    const location =
        useLocation();

    const allowed =
        hasRequiredRole(
            user,
            allowedRole
        );
        console.log("ROLE DEBUG:", {
    user,
    userRole: user?.role,
    allowedRole,
    roleMatch:
        user?.role === allowedRole
});

    if (!allowed) {

        recordSecurityEvent({
            eventType:
                SECURITY_EVENTS
                    .ADMIN_ACCESS_DENIED,

            result:
                SECURITY_RESULTS
                    .DENIED,

            actorId:
                user?.id,

            route:
                location.pathname,

            reason:
                `Required role: ${allowedRole}`
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
            allowedRole === "admin"
                ? SECURITY_EVENTS
                    .ADMIN_ACCESS_GRANTED
                : SECURITY_EVENTS
                    .ADMIN_ACCESS_GRANTED,

        result:
            SECURITY_RESULTS
                .SUCCESS,

        actorId:
            user?.id,

        route:
            location.pathname,

        reason:
            `Role verified: ${allowedRole}`
    });

    return children;
}

export default RoleBasedRoute;