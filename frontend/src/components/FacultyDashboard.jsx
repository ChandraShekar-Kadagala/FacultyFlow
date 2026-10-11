import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";


import {
    useNavigate
} from "react-router-dom";


import useAuth
    from "../hooks/useAuth";


import useDeviceLocation
    from "../hooks/useDeviceLocation";


import {
    getTodayAttendance,
    checkInAttendance,
    checkOutAttendance
} from "../services/attendance/attendanceService";


import VerificationStatusCard
    from "../components/verification/VerificationStatusCard";


// ============================================================
// FORMAT SERVER TIME
// ============================================================

function formatTime(value) {

    if (!value) {
        return "--:--";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--:--";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


// ============================================================
// ATTENDANCE ERROR MESSAGE
// ============================================================

function getAttendanceErrorMessage(
    error,
    fallbackMessage
) {

    switch (
        error?.code
    ) {

        case "ATTENDANCE_ALREADY_EXISTS":

            return (
                "You have already checked in today."
            );


        case "CHECK_IN_REQUIRED":

            return (
                "Please check in before checking out."
            );


        case "CHECK_OUT_ALREADY_COMPLETED":

            return (
                "You have already checked out today."
            );


        case "FACULTY_INACTIVE":

            return (
                "Your faculty account is inactive."
            );


        case "FACULTY_NOT_FOUND":

            return (
                "Faculty profile was not found."
            );


        case "FACULTY_PROFILE_UNAVAILABLE":

            return (
                "Your faculty profile is unavailable."
            );


        case "ATTENDANCE_VERIFICATION_FAILED":

            return (
                error?.message ||
                "Attendance verification failed."
            );


        case "ATTENDANCE_VERIFICATION_INCOMPLETE":

            return (
                error?.message ||
                "Attendance verification is incomplete."
            );


        case "ATTENDANCE_OUTSIDE_ALLOWED_TIME":

            return (
                error?.message ||
                "Attendance cannot be recorded at this time."
            );


        case "NETWORK_ERROR":

            return (
                "Unable to connect to the FacultyFlow server."
            );


        case "VALIDATION_ERROR":

            return (
                "The attendance request is invalid."
            );


        case "INTERNAL_SERVER_ERROR":

            return (
                "Something went wrong on the server."
            );


        default:

            return (
                error?.message ||
                fallbackMessage
            );

    }

}


// ============================================================
// FACULTY DASHBOARD
// ============================================================

function FacultyDashboard() {

    const navigate =
        useNavigate();


    const {
        user,
        accessToken
    } = useAuth();


    // ========================================================
    // DEVICE LOCATION
    // ========================================================

    const {
        loading:
            locationLoading,

        error:
            locationError,

        supported:
            locationSupported,

        captureLocation

    } = useDeviceLocation();


    // ========================================================
    // ATTENDANCE STATE
    // ========================================================

    const [
        attendance,
        setAttendance
    ] = useState(null);


    const [
        attendanceLoading,
        setAttendanceLoading
    ] = useState(true);


    const [
        attendanceError,
        setAttendanceError
    ] = useState("");


    // ========================================================
    // ACTION STATE
    // ========================================================

    const [
        actionLoading,
        setActionLoading
    ] = useState(false);


    const [
        actionMessage,
        setActionMessage
    ] = useState("");


    // ========================================================
    // VERIFICATION STATE
    // ========================================================

    const [
        verification,
        setVerification
    ] = useState(null);


    // ========================================================
    // FACULTY INFORMATION
    // ========================================================

    const facultyId =
        user?.facultyId ||
        "--";


    const facultyName =
        user?.name ||
        "Faculty";


    const facultyDepartment =
        user?.department ||
        "--";


    const facultyDesignation =
        user?.designation ||
        "--";


    // ========================================================
    // LOAD TODAY'S ATTENDANCE
    // ========================================================

    const loadTodayAttendance =
        useCallback(
            async () => {

                if (!accessToken) {

                    setAttendance(null);

                    setVerification(null);

                    setAttendanceLoading(false);

                    setAttendanceError(
                        "Authentication session is missing."
                    );

                    return;

                }


                setAttendanceLoading(true);

                setAttendanceError("");


                try {

                    const response =
                        await getTodayAttendance(
                            accessToken
                        );


                    const todayAttendance =
                        response?.attendance ||
                        null;


                    setAttendance(
                        todayAttendance
                    );


                    // ------------------------------------------------
                    // Existing attendance records may contain the
                    // overall verification status.
                    //
                    // Detailed provider verification is populated
                    // after a new check-in/check-out response.
                    // ------------------------------------------------

                    if (
                        !todayAttendance
                    ) {

                        setVerification(null);

                    } else if (response?.verification) {
                        setVerification(response.verification);
                    }

                } catch (error) {

                    console.error(
                        "Failed to load today's attendance:",
                        error
                    );


                    setAttendance(null);

                    setVerification(null);


                    setAttendanceError(
                        getAttendanceErrorMessage(
                            error,
                            "Failed to load today's attendance."
                        )
                    );

                } finally {

                    setAttendanceLoading(false);

                }

            },
            [
                accessToken
            ]
        );


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(
        () => {

            loadTodayAttendance();

        },
        [
            loadTodayAttendance
        ]
    );


    // ========================================================
    // CHECK-IN
    // ========================================================

    const handleCheckIn =
        async () => {

            if (
                !accessToken ||
                actionLoading
            ) {

                return;

            }


            setActionMessage("");

            setAttendanceError("");

            setActionLoading(true);


            try {

                // ------------------------------------------------
                // CAPTURE REAL LOCATION
                // ------------------------------------------------

                const location =
                    await captureLocation();


                // ------------------------------------------------
                // SEND LOCATION TO BACKEND
                // ------------------------------------------------

                const response =
                    await checkInAttendance(
                        location,
                        accessToken
                    );


                // ------------------------------------------------
                // STORE REAL VERIFICATION RESULT
                // ------------------------------------------------

                setVerification(
                    response?.verification ||
                    null
                );


                setActionMessage(
                    "Check-in request completed successfully."
                );


                // ------------------------------------------------
                // REFRESH SERVER STATE
                // ------------------------------------------------

                await loadTodayAttendance();

            } catch (error) {

                console.error(
                    "Check-in failed:",
                    error
                );


                // ------------------------------------------------
                // Backend may return verification even when
                // attendance was rejected.
                // ------------------------------------------------

                if (
                    error?.data?.verification
                ) {

                    setVerification(
                        error.data.verification
                    );

                } else if (
                    error?.verification
                ) {

                    setVerification(
                        error.verification
                    );

                }


                setAttendanceError(
                    getAttendanceErrorMessage(
                        error,
                        "Check-in failed."
                    )
                );

            } finally {

                setActionLoading(false);

            }

        };


    // ========================================================
    // CHECK-OUT
    // ========================================================

    const handleCheckOut =
        async () => {

            if (
                !accessToken ||
                actionLoading
            ) {

                return;

            }


            setActionMessage("");

            setAttendanceError("");

            setActionLoading(true);


            try {

                // ------------------------------------------------
                // CAPTURE FRESH REAL LOCATION
                // ------------------------------------------------

                const location =
                    await captureLocation();


                // ------------------------------------------------
                // SEND LOCATION TO BACKEND
                // ------------------------------------------------

                const response =
                    await checkOutAttendance(
                        location,
                        accessToken
                    );


                // ------------------------------------------------
                // STORE REAL VERIFICATION RESULT
                // ------------------------------------------------

                setVerification(
                    response?.verification ||
                    null
                );


                setActionMessage(
                    "Check-out request completed successfully."
                );


                // ------------------------------------------------
                // REFRESH SERVER STATE
                // ------------------------------------------------

                await loadTodayAttendance();

            } catch (error) {

                console.error(
                    "Check-out failed:",
                    error
                );


                if (
                    error?.data?.verification
                ) {

                    setVerification(
                        error.data.verification
                    );

                } else if (
                    error?.verification
                ) {

                    setVerification(
                        error.verification
                    );

                }


                setAttendanceError(
                    getAttendanceErrorMessage(
                        error,
                        "Check-out failed."
                    )
                );

            } finally {

                setActionLoading(false);

            }

        };


    // ========================================================
    // ATTENDANCE STATUS
    // ========================================================

    const attendanceStatus =
        useMemo(
            () => {

                if (!attendance) {

                    return "Not Checked In";

                }


                if (
                    attendance.checkOutTime
                ) {

                    return "Checked Out";

                }


                if (
                    attendance.checkInTime
                ) {

                    return (
                        attendance.status ||
                        "Present"
                    );

                }


                return "Not Checked In";

            },
            [
                attendance
            ]
        );


    // ========================================================
    // OVERALL VERIFICATION STATUS
    // ========================================================

    const verificationStatus =
        verification?.result ||
        attendance?.verificationStatus ||
        (attendance ? "Verified" : "Awaiting Check-In");


    // ========================================================
    // SYNC STATUS
    // ========================================================

    const syncStatus =
        attendance?.syncStatus ||
        (attendance ? "SYNCED" : "Awaiting Check-In");


    // ========================================================
    // ATTENDANCE ACTION RULES
    // ========================================================

    const canCheckIn =
        Boolean(accessToken) &&
        !attendanceLoading &&
        !actionLoading &&
        !attendance &&
        !attendanceError;


    const canCheckOut =
        Boolean(accessToken) &&
        !attendanceLoading &&
        !actionLoading &&
        Boolean(
            attendance?.checkInTime
        ) &&
        !attendance?.checkOutTime &&
        !attendanceError;


    // ========================================================
    // LOCATION STATUS
    // ========================================================

    const locationStatus =
        !locationSupported
            ? "Unsupported"
            : locationError
                ? "Unavailable"
                : "Ready";


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <section className="faculty-dashboard">


            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        FACULTY WORKSPACE
                    </span>


                    <h1>
                        Faculty Dashboard
                    </h1>


                    <p>
                        Manage today's attendance,
                        verification and history.
                    </p>

                </div>


                <button
                    className="btn-secondary"
                    type="button"
                    onClick={() =>
                        navigate(
                            `/profile`
                        )
                    }
                >

                    <span>
                        ◉
                    </span>

                    View Faculty Details

                </button>

            </div>


            {/* ==================================================
                SUCCESS MESSAGE
            ================================================== */}

            {actionMessage && (

                <div
                    className="dashboard-message success"
                    role="status"
                >

                    {actionMessage}

                </div>

            )}


            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {attendanceError && (

                <div
                    className="dashboard-message error"
                    role="alert"
                >

                    <span>
                        {attendanceError}
                    </span>


                    <button
                        type="button"
                        onClick={() =>
                            loadTodayAttendance()
                        }
                        disabled={
                            attendanceLoading ||
                            actionLoading
                        }
                    >

                        {attendanceLoading
                            ? "Refreshing..."
                            : "Retry"}

                    </button>

                </div>

            )}


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="dashboard-summary-grid">


                {/* TODAY STATUS */}

                <article className="summary-card">

                    <div className="summary-icon blue">
                        ✓
                    </div>


                    <div>

                        <span>
                            Today's Status
                        </span>


                        <strong>

                            {attendanceLoading
                                ? "Loading..."
                                : attendanceError
                                    ? "Unavailable"
                                    : attendanceStatus}

                        </strong>

                    </div>

                </article>


                {/* CHECK-IN */}

                <article className="summary-card">

                    <div className="summary-icon green">
                        ↗
                    </div>


                    <div>

                        <span>
                            Check In
                        </span>


                        <strong>

                            {attendanceLoading
                                ? "Loading..."
                                : formatTime(
                                    attendance?.checkInTime
                                )}

                        </strong>

                    </div>

                </article>


                {/* CHECK-OUT */}

                <article className="summary-card">

                    <div className="summary-icon purple">
                        ↘
                    </div>


                    <div>

                        <span>
                            Check Out
                        </span>


                        <strong>

                            {attendanceLoading
                                ? "Loading..."
                                : formatTime(
                                    attendance?.checkOutTime
                                )}

                        </strong>

                    </div>

                </article>


                {/* VERIFICATION */}

                <article className="summary-card">

                    <div className="summary-icon amber">
                        ✓
                    </div>


                    <div>

                        <span>
                            Verification
                        </span>


                        <strong>
                            {attendanceLoading
                                ? "Loading..."
                                : verificationStatus}
                        </strong>

                    </div>

                </article>

            </div>


            {/* ==================================================
                TODAY'S ATTENDANCE
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            TODAY
                        </span>


                        <h2>
                            Attendance Status
                        </h2>


                        <p>
                            Current attendance state for{" "}
                            {facultyName}.
                        </p>

                    </div>


                    <span
                        className={`status-badge ${
                            attendanceStatus ===
                                "Present" ||
                            attendanceStatus ===
                                "Checked Out"
                                ? "present"
                                : "pending"
                        }`}
                    >

                        {attendanceLoading
                            ? "Loading..."
                            : attendanceError
                                ? "Unavailable"
                                : attendanceStatus}

                    </span>

                </div>


                <div className="today-details-grid">


                    <div className="today-detail">

                        <span>
                            Faculty ID
                        </span>

                        <strong>
                            {facultyId}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Date
                        </span>

                        <strong>
                            {attendance?.date ||
                                new Date().toISOString().slice(0, 10)}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Check In
                        </span>

                        <strong>
                            {formatTime(
                                attendance?.checkInTime
                            )}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Check Out
                        </span>

                        <strong>
                            {formatTime(
                                attendance?.checkOutTime
                            )}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Verification
                        </span>

                        <strong>
                            {verificationStatus}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Sync Status
                        </span>

                        <strong>
                            {syncStatus}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Attendance ID
                        </span>

                        <strong>
                            {attendance?.attendanceId ||
                                (attendanceLoading ? "Loading..." : "Generated at check-in")}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Source
                        </span>

                        <strong>
                            {attendance?.source ||
                                "Web Application"}
                        </strong>

                    </div>

                </div>

            </section>


            {/* ==================================================
                ATTENDANCE ACTION
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            ATTENDANCE ACTION
                        </span>


                        <h2>
                            Record Attendance
                        </h2>


                        <p>
                            Check-in and check-out are
                            processed by the FacultyFlow
                            server.
                        </p>

                    </div>

                </div>


                <div className="attendance-action-content">


                    <div>

                        <h3>

                            {canCheckIn
                                ? "Ready to check in?"
                                : canCheckOut
                                    ? "Check out when you finish."
                                    : attendance?.checkOutTime
                                        ? "Today's attendance is complete."
                                        : "Attendance unavailable."}

                        </h3>


                        <p>

                            Server time is used as the
                            authoritative attendance timestamp.

                        </p>

                    </div>


                    <div className="attendance-actions">


                        <button
                            className="btn-primary"
                            type="button"
                            onClick={
                                handleCheckIn
                            }
                            disabled={
                                !canCheckIn ||
                                locationLoading
                            }
                        >

                            {actionLoading
                                ? "Processing..."
                                : locationLoading
                                    ? "Detecting Location..."
                                    : "Check In"}

                        </button>


                        <button
                            className="btn-secondary"
                            type="button"
                            onClick={
                                handleCheckOut
                            }
                            disabled={
                                !canCheckOut ||
                                locationLoading
                            }
                        >

                            {actionLoading
                                ? "Processing..."
                                : locationLoading
                                    ? "Detecting Location..."
                                    : "Check Out"}

                        </button>

                    </div>

                </div>


                <div className="action-help">

                    <strong>
                        Location:
                    </strong>{" "}

                    {locationLoading
                        ? "Detecting your current location..."
                        : locationError
                            ? locationError.message
                            : locationSupported
                                ? "Ready. Your real device location will be sent with the attendance request."
                                : "This browser does not provide location services."}

                </div>


                {!attendance &&
                    !attendanceLoading &&
                    !attendanceError && (

                    <p className="action-help">

                        You have not checked in today.
                        Use Check In to record your
                        attendance.

                    </p>

                )}


                {attendance?.checkInTime &&
                    !attendance?.checkOutTime &&
                    !attendanceLoading &&
                    !attendanceError && (

                    <p className="action-help">

                        Your check-in has been recorded.
                        Use Check Out when you finish your day.

                    </p>

                )}


                {attendance?.checkOutTime &&
                    !attendanceLoading && (

                    <p className="action-help">

                        Today's attendance is complete.

                    </p>

                )}

            </section>


            {/* ==================================================
                REAL VERIFICATION STATUS
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            VERIFICATION
                        </span>


                        <h2>
                            Verification Status
                        </h2>


                        <p>
                            Results returned by the
                            FacultyFlow verification engine.
                        </p>

                    </div>

                </div>


                <VerificationStatusCard
                    verification={
                        verification
                    }
                />


                {/* ------------------------------------------------
                    LOCATION STATUS
                ------------------------------------------------ */}

                <div className="today-details-grid">

                    <div className="today-detail">

                        <span>
                            Browser Location
                        </span>

                        <strong>
                            {locationStatus}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Location Support
                        </span>

                        <strong>
                            {locationSupported
                                ? "Supported"
                                : "Unsupported"}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Attendance Verification
                        </span>

                        <strong>
                            {verificationStatus}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Sync Status
                        </span>

                        <strong>
                            {syncStatus}
                        </strong>

                    </div>

                </div>


                {locationError && (

                    <p className="verification-note">

                        {locationError.message}

                    </p>

                )}


                <p className="verification-note">

                    Location is captured when an attendance
                    action is submitted. The client does not
                    decide whether the faculty member is inside
                    the campus. Campus verification is performed
                    by the backend.

                </p>

            </section>


            {/* ==================================================
                HISTORY
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            HISTORY
                        </span>


                        <h2>
                            Attendance History
                        </h2>


                        <p>
                            View your complete attendance
                            history from the backend.
                        </p>

                    </div>


                    <button
                        className="btn-secondary"
                        type="button"
                        onClick={() =>
                            navigate(
                                "/attendance"
                            )
                        }
                    >

                        View All

                    </button>

                </div>


                <div className="history-preview">

                    {attendanceLoading ? (

                        <p>
                            Loading today's attendance...
                        </p>

                    ) : attendance ? (

                        <div>

                            <p>
                                Today's attendance record
                                is available.
                            </p>


                            <p>

                                <strong>
                                    Attendance ID:
                                </strong>{" "}

                                {attendance.attendanceId}

                            </p>


                            <p>

                                <strong>
                                    Status:
                                </strong>{" "}

                                {attendance.status}

                            </p>


                            <p>

                                <strong>
                                    Verification:
                                </strong>{" "}

                                {verificationStatus}

                            </p>

                        </div>

                    ) : (

                        <p>
                            No attendance record exists
                            for today.
                        </p>

                    )}

                </div>

            </section>


            {/* ==================================================
                FACULTY INFORMATION
            ================================================== */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            FACULTY
                        </span>


                        <h2>
                            Faculty Information
                        </h2>

                    </div>


                    <button
                        className="btn-secondary"
                        type="button"
                        onClick={() =>
                            navigate(
                                "/profile"
                            )
                        }
                    >

                        View Profile

                    </button>

                </div>


                <div className="today-details-grid">


                    <div className="today-detail">

                        <span>
                            Name
                        </span>

                        <strong>
                            {facultyName}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Faculty ID
                        </span>

                        <strong>
                            {facultyId}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Department
                        </span>

                        <strong>
                            {facultyDepartment}
                        </strong>

                    </div>


                    <div className="today-detail">

                        <span>
                            Designation
                        </span>

                        <strong>
                            {facultyDesignation}
                        </strong>

                    </div>

                </div>

            </section>


        </section>

    );

}


export default FacultyDashboard;