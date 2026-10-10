import {
    useMemo
} from "react";

import useAuth
    from "../hooks/useAuth";

import {
    validateUserSession
} from "../services/security/authSecurity";


function SecurityStatus() {

    const {
        user
    } = useAuth();

    const session =
        useMemo(
            () =>
                validateUserSession(
                    user
                ),
            [user]
        );


    if (
        !session.authenticated
    ) {
        return (
            <div className="security-status security-status-danger">
                Authentication Required
            </div>
        );
    }


    if (
        !session.authorized
    ) {
        return (
            <div className="security-status security-status-danger">
                Access Restricted
            </div>
        );
    }


    return (
        <div className="security-status security-status-safe">
            Secure Session
        </div>
    );
}

export default SecurityStatus;