import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import useAuth
    from "../hooks/useAuth";

import {
    getAdminDashboardSummary
} from "../services/admin/dashboardService";


// ============================================================
// ADMIN DASHBOARD PAGE
// ============================================================

function AdminDashboardPage() {

    const {
        accessToken
    } = useAuth();

    const navigate =
        useNavigate();


    // ========================================================
    // SUMMARY
    // ========================================================

    const [
        summary,
        setSummary
    ] = useState(null);


    // ========================================================
    // LOADING
    // ========================================================

    const [
        loading,
        setLoading
    ] = useState(true);


    // ========================================================
    // ERROR
    // ========================================================

    const [
        error,
        setError
    ] = useState("");


    // ========================================================
    // LOAD DASHBOARD SUMMARY
    // ========================================================

    useEffect(() => {

        async function loadDashboard() {

            setLoading(true);

            setError("");


            try {

                const response =
                    await getAdminDashboardSummary(
                        accessToken
                    );


                setSummary(
                    response.summary
                );

            } catch (error) {

                console.error(
                    "Failed to load admin dashboard:",
                    error
                );


                setError(
                    error.message ||
                    "Failed to load dashboard data."
                );

            } finally {

                setLoading(false);

            }

        }


        if (accessToken) {

            loadDashboard();

        } else {

            setLoading(false);

            setError(
                "Authentication session is missing."
            );

        }

    }, [accessToken]);


    // ========================================================
    // ATTENDANCE DATA
    // ========================================================

    const attendance =
        summary?.attendance || {};


    // ========================================================
    // DISPLAY VALUES
    // ========================================================

    const totalFaculty =
        summary?.totalFaculty ?? "—";


    const presentToday =
        attendance.presentToday ?? "—";


    const lateToday =
        attendance.lateToday ?? "—";


    const absentToday =
        attendance.absentToday ?? "—";


    const verifiedToday =
        attendance.verifiedToday ?? "—";


    const pendingVerification =
        attendance.pendingVerification ?? "—";


    const attendanceRate =
        attendance.attendanceRate !== null &&
        attendance.attendanceRate !== undefined
            ? `${attendance.attendanceRate}%`
            : "—";


    const verificationRate =
        attendance.verificationRate !== null &&
        attendance.verificationRate !== undefined
            ? `${attendance.verificationRate}%`
            : "—";


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <section className="admin-dashboard">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        ADMIN WORKSPACE
                    </span>


                    <h1>
                        Admin Dashboard
                    </h1>


                    <p>
                        Attendance overview and
                        faculty administration.
                    </p>

                </div>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="action-message">

                    {error}

                </div>

            )}


            {/* ==================================================
                KPI GRID
            ================================================== */}

            <div className="dashboard-summary-grid">


                {/* TOTAL FACULTY */}

                <article className="summary-card">

                    <div className="summary-icon blue">
                        F
                    </div>


                    <div>

                        <span>
                            Total Faculty
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : totalFaculty}

                        </strong>

                    </div>

                </article>


                {/* PRESENT */}

                <article className="summary-card">

                    <div className="summary-icon green">
                        P
                    </div>


                    <div>

                        <span>
                            Present Today
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : presentToday}

                        </strong>

                    </div>

                </article>


                {/* LATE */}

                <article className="summary-card">

                    <div className="summary-icon amber">
                        L
                    </div>


                    <div>

                        <span>
                            Late Today
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : lateToday}

                        </strong>

                    </div>

                </article>


                {/* ABSENT */}

                <article className="summary-card">

                    <div className="summary-icon red">
                        A
                    </div>


                    <div>

                        <span>
                            Absent Today
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : absentToday}

                        </strong>

                    </div>

                </article>


            </div>


            {/* ==================================================
                VERIFICATION KPIs
            ================================================== */}

            <div className="dashboard-summary-grid">


                {/* VERIFIED */}

                <article className="summary-card">

                    <div className="summary-icon green">
                        ✓
                    </div>


                    <div>

                        <span>
                            Verified Today
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : verifiedToday}

                        </strong>

                    </div>

                </article>


                {/* PENDING */}

                <article className="summary-card">

                    <div className="summary-icon amber">
                        !
                    </div>


                    <div>

                        <span>
                            Pending Verification
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : pendingVerification}

                        </strong>

                    </div>

                </article>


                {/* ATTENDANCE RATE */}

                <article className="summary-card">

                    <div className="summary-icon blue">
                        %
                    </div>


                    <div>

                        <span>
                            Attendance Rate
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : attendanceRate}

                        </strong>

                    </div>

                </article>


                {/* VERIFICATION RATE */}

                <article className="summary-card">

                    <div className="summary-icon purple">
                        V
                    </div>


                    <div>

                        <span>
                            Verification Rate
                        </span>


                        <strong>

                            {loading
                                ? "..."
                                : verificationRate}

                        </strong>

                    </div>

                </article>


            </div>


            {/* ==================================================
                TODAY INFORMATION
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            TODAY
                        </span>


                        <h2>
                            Attendance Overview
                        </h2>


                        <p>
                            Live attendance data from
                            the server.
                        </p>

                    </div>


                    <span>
                        {summary?.date || "—"}
                    </span>

                </div>


                <div className="today-details-grid">


                    <div className="today-detail">

                        <span>
                            Present
                        </span>


                        <strong>
                            {presentToday}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Late
                        </span>


                        <strong>
                            {lateToday}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Verified
                        </span>


                        <strong>
                            {verifiedToday}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Pending
                        </span>


                        <strong>
                            {pendingVerification}
                        </strong>

                    </div>

                </div>

            </section>


            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            ADMIN TOOLS
                        </span>


                        <h2>
                            Quick Actions
                        </h2>

                    </div>

                </div>


                <div className="attendance-action-buttons">

                    <button
                        className="btn-primary"
                        onClick={() =>
                            navigate(
                                "/admin/attendance"
                            )
                        }
                    >
                        View Attendance
                    </button>


                    <button
                        className="btn-secondary"
                        onClick={() =>
                            navigate(
                                "/admin/faculty"
                            )
                        }
                    >
                        Manage Faculty
                    </button>

                </div>

            </section>


        </section>

    );

}


export default AdminDashboardPage;