import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Header() {
    const {
        user,
        logout
    } = useAuth();

    const navigate = useNavigate();

    function handleLogout() {
        logout();

        navigate(
            "/login",
            {
                replace: true
            }
        );
    }

    return (
        <header className="header">

            <div className="header-brand">
                <div className="brand-mark">
                    F
                </div>

                <div>
                    <h2>
                        FacultyFlow
                    </h2>

                    <span className="brand-subtitle">
                        Attendance Platform
                    </span>
                </div>
            </div>

            <div className="header-user">

                <div className="header-user-info">
                    <strong>
                        {user?.name || "User"}
                    </strong>

                    <span>
                        {user?.role === "admin"
                            ? "Administrator"
                            : "Faculty"}
                    </span>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </header>
    );
}

export default Header;