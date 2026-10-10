import {
    useNavigate
} from "react-router-dom";

import useAuth
    from "../hooks/useAuth";


function SecurityAccessDeniedPage() {

    const navigate =
        useNavigate();

    const {
        user
    } = useAuth();

    const isAdmin =
        user?.role === "admin";


    return (
        <section className="security-denied-page">

            <div className="security-denied-card">

                <div className="security-denied-icon">
                    🔒
                </div>

                <span className="eyebrow">
                    ACCESS CONTROL
                </span>

                <h1>
                    Access Restricted
                </h1>

                <p>
                    Your account does not
                    have permission to access
                    this resource.
                </p>

                <div className="security-denied-meta">

                    <span>
                        Current Role
                    </span>

                    <strong>
                        {
                            user?.role ||
                            "Unauthenticated"
                        }
                    </strong>

                </div>

                <button
                    className="btn-primary"
                    onClick={() =>
                        navigate(
                            isAdmin
                                ? "/admin"
                                : "/faculty"
                        )
                    }
                >
                    Return to Dashboard
                </button>

            </div>

        </section>
    );
}

export default SecurityAccessDeniedPage;