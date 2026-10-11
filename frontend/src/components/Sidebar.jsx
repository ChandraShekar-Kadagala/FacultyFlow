import {
    NavLink
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

function Sidebar() {
    const { user } = useAuth();

    function getLinkClass({ isActive }) {
        return isActive
            ? "nav-link active"
            : "nav-link";
    }

    return (
        <aside className="sidebar">

            <div className="sidebar-inner">

                <div className="sidebar-section-label">
                    WORKSPACE
                </div>

                <nav className="sidebar-nav">

                    {user?.role === "faculty" && (
                        <>
                            <NavLink
                                to="/faculty"
                                className={getLinkClass}
                                end
                            >
                                <span className="nav-icon">
                                    ▦
                                </span>

                                <span>
                                    Dashboard
                                </span>
                            </NavLink>

                            <NavLink
                                to="/attendance"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ◷
                                </span>

                                <span>
                                    Attendance
                                </span>
                            </NavLink>

                            <NavLink
                                to="/profile"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ◉
                                </span>

                                <span>
                                    Profile
                                </span>
                            </NavLink>
                        </>
                    )}

                    {user?.role === "admin" && (
                        <>
                            <NavLink
                                to="/admin"
                                className={getLinkClass}
                                end
                            >
                                <span className="nav-icon">
                                    ▦
                                </span>

                                <span>
                                    Dashboard
                                </span>
                            </NavLink>
                            <NavLink
                                to="/admin/faculty"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ◉
                                </span>

                                <span>
                                    Manage Faculty
                                </span>
                            </NavLink>
                            <NavLink
                                to="/admin/attendance"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ◷
                                </span>

                                <span>
                                    Attendance
                                </span>
                            </NavLink>
                            <NavLink
                                to="/admin/audit"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ◎
                                </span>

                                <span>
                                    Audit Logs
                                </span>
                            </NavLink>
                            <NavLink
                                to="/admin/policy"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ⚙
                                </span>

                                <span>
                                    Policy
                                </span>
                            </NavLink>
                            <NavLink
                                to="/admin/location"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ⌖
                                </span>

                                <span>
                                    Locations
                                </span>
                            </NavLink>
                            <NavLink
                                to="/admin/network"
                                className={getLinkClass}
                            >
                                <span className="nav-icon">
                                    ⍫
                                </span>

                                <span>
                                    Network
                                </span>
                            </NavLink>
                        </>
                    )}

                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {user?.name?.charAt(0) || "U"}
                        </div>

                        <div>
                            <strong>
                                {user?.name || "User"}
                            </strong>

                            <span>
                                {user?.role || "User"}
                            </span>
                        </div>
                    </div>
                </div>

            </div>

        </aside>
    );
}

export default Sidebar;