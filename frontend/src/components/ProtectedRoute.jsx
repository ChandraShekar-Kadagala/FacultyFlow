import {
    Navigate,
    useLocation
} from "react-router-dom";

import useAuth
    from "../hooks/useAuth";

import {
    validateUserSession
} from "../services/security/authSecurity";

import {
    recordSecurityEvent
} from "../services/security/securityAudit";

import {
    SECURITY_EVENTS,
    SECURITY_RESULTS
} from "../utils/security/securityConstants";


function ProtectedRoute({
    children
}) {
    const {
        user
    } = useAuth();

    const location =
        useLocation();

    const session =
        validateUserSession(
            user
        );

    if (!session.authenticated) {

        recordSecurityEvent({
            eventType:
                SECURITY_EVENTS
                    .ADMIN_ROUTE_BLOCKED,

            result:
                SECURITY_RESULTS
                    .DENIED,

            actorId:
                user?.id,

            route:
                location.pathname,

            reason:
                session.reason
        });

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }

    if (!session.authorized) {

        recordSecurityEvent({
            eventType:
                SECURITY_EVENTS
                    .INVALID_ROLE,

            result:
                SECURITY_RESULTS
                    .BLOCKED,

            actorId:
                user?.id,

            route:
                location.pathname,

            reason:
                session.reason
        });

        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;