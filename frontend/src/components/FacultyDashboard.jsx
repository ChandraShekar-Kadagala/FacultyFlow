import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useDeviceLocation from "../hooks/useDeviceLocation";
import {
    getTodayAttendance,
    checkInAttendance,
    checkOutAttendance
} from "../services/attendance/attendanceService";
import VerificationStatusCard from "../components/verification/VerificationStatusCard";
import { calculateWorkingDuration } from "../utils/durationUtils";

function formatTime(value) {
    if (!value) return "--:--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function formatDate(value) {
    const d = value ? new Date(value) : new Date();
    return d.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getAttendanceErrorMessage(error, fallbackMessage) {
    switch (error?.code) {
        case "ATTENDANCE_ALREADY_EXISTS":
            return "You have already recorded check-in for today.";
        case "CHECK_IN_REQUIRED":
            return "Please check in before attempting to check out.";
        case "CHECK_OUT_ALREADY_COMPLETED":
            return "You have already checked out today.";
        case "FACULTY_INACTIVE":
            return "Your faculty account is currently inactive. Contact university admin.";
        case "FACULTY_NOT_FOUND":
            return "Faculty profile was not found on the server.";
        case "FACULTY_PROFILE_UNAVAILABLE":
            return "Your faculty profile is temporarily unavailable.";
        case "ATTENDANCE_VERIFICATION_FAILED":
            return error?.message || "Attendance verification failed.";
        case "ATTENDANCE_OUTSIDE_ALLOWED_TIME":
            return error?.message || "Attendance cannot be recorded outside the allowed policy window.";
        case "NETWORK_ERROR":
            return "Unable to connect to the FacultyFlow server. Check your connection.";
        default:
            return error?.message || fallbackMessage;
    }
}

function FacultyDashboard() {
    const navigate = useNavigate();
    const { user, accessToken } = useAuth();

    const {
        loading: locationLoading,
        error: locationError,
        supported: locationSupported,
        captureLocation
    } = useDeviceLocation();

    const [attendance, setAttendance] = useState(null);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [attendanceError, setAttendanceError] = useState("");

    const [actionLoading, setActionLoading] = useState(false);
    const [actionType, setActionType] = useState(null); // 'check-in' | 'check-out' | null
    const [actionMessage, setActionMessage] = useState("");

    const [verification, setVerification] = useState(null);

    const facultyId = user?.facultyId || user?.userId || "--";
    const facultyName = user?.name || "Faculty Member";
    const facultyDepartment = user?.department || "Academic Department";
    const facultyDesignation = user?.designation || "Faculty";

    const loadTodayAttendance = useCallback(async () => {
        if (!accessToken) {
            setAttendance(null);
            setVerification(null);
            setAttendanceLoading(false);
            setAttendanceError("Authentication session is missing.");
            return;
        }

        setAttendanceLoading(true);
        setAttendanceError("");

        try {
            const response = await getTodayAttendance(accessToken);
            const todayRecord = response?.attendance || null;
            setAttendance(todayRecord);

            if (response?.verification) {
                setVerification(response.verification);
            } else if (!todayRecord) {
                setVerification(null);
            }
        } catch (error) {
            console.error("Failed to load today's attendance:", error);
            setAttendance(null);
            setVerification(null);
            setAttendanceError(
                getAttendanceErrorMessage(error, "Failed to load today's attendance.")
            );
        } finally {
            setAttendanceLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        loadTodayAttendance();
    }, [loadTodayAttendance]);

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!attendance?.checkInTime || attendance?.checkOutTime) return;
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 10000);
        return () => clearInterval(interval);
    }, [attendance?.checkInTime, attendance?.checkOutTime]);

    const durationInfo = useMemo(() => {
        if (!attendance?.checkInTime) return null;
        return calculateWorkingDuration(attendance.checkInTime, attendance.checkOutTime, { currentTime: now });
    }, [attendance?.checkInTime, attendance?.checkOutTime, now]);

    // Attendance state machine computation
    const attendanceStatus = useMemo(() => {
        if (!attendance) return "Not Checked In";
        if (attendance.checkOutTime) return attendance.status || "Completed";
        if (attendance.checkInTime) return "Session in progress";
        return "Not Checked In";
    }, [attendance]);

    const canCheckIn =
        Boolean(accessToken) &&
        !attendanceLoading &&
        !actionLoading &&
        !attendance;

    const canCheckOut =
        Boolean(accessToken) &&
        !attendanceLoading &&
        !actionLoading &&
        Boolean(attendance?.checkInTime) &&
        !attendance?.checkOutTime;

    const isAttendanceComplete = Boolean(attendance?.checkInTime && attendance?.checkOutTime);

    // Record Attendance Action Handler
    async function handleCheckIn() {
        if (!canCheckIn) return;

        setActionMessage("");
        setAttendanceError("");
        setActionLoading(true);
        setActionType("check-in");

        try {
            const location = await captureLocation();
            const response = await checkInAttendance(location, accessToken);

            setVerification(response?.verification || null);
            setActionMessage("Check-in recorded and verified successfully.");
            await loadTodayAttendance();
        } catch (error) {
            console.error("Check-in error:", error);
            if (error?.data?.verification) {
                setVerification(error.data.verification);
            } else if (error?.verification) {
                setVerification(error.verification);
            }
            setAttendanceError(
                getAttendanceErrorMessage(error, "Check-in failed. Please try again.")
            );
        } finally {
            setActionLoading(false);
            setActionType(null);
        }
    }

    async function handleCheckOut() {
        if (!canCheckOut) return;

        setActionMessage("");
        setAttendanceError("");
        setActionLoading(true);
        setActionType("check-out");

        try {
            const location = await captureLocation();
            const response = await checkOutAttendance(location, accessToken);

            setVerification(response?.verification || null);
            setActionMessage("Check-out recorded successfully.");
            await loadTodayAttendance();
        } catch (error) {
            console.error("Check-out error:", error);
            if (error?.data?.verification) {
                setVerification(error.data.verification);
            } else if (error?.verification) {
                setVerification(error.verification);
            }
            setAttendanceError(
                getAttendanceErrorMessage(error, "Check-out failed. Please try again.")
            );
        } finally {
            setActionLoading(false);
            setActionType(null);
        }
    }

    const verificationBadgeText = !attendance
        ? "Awaiting Check-In"
        : (verification?.result || attendance?.verificationStatus || "Verified");

    return (
        <section className="faculty-dashboard">
            {/* 1. DASHBOARD HEADING */}
            <header className="faculty-dashboard-header">
                <div className="header-faculty-info">
                    <span className="eyebrow">FACULTY WORKSPACE</span>
                    <h1>Faculty Attendance Dashboard</h1>
                    <p className="faculty-subtitle">
                        Welcome back, <strong>{facultyName}</strong> &bull; {facultyDepartment} ({facultyDesignation}) &bull; ID: <code>{facultyId}</code>
                    </p>
                </div>

                <div className="header-meta-actions">
                    <div className="header-date-badge">
                        📅 {formatDate(attendance?.date)}
                    </div>
                    <span className={`status-pill ${
                        attendanceStatus === "Present" || attendanceStatus === "Session in progress"
                            ? "status-present"
                            : attendanceStatus === "Completed" || attendanceStatus === "Checked Out"
                                ? "status-checkout"
                                : "status-pending"
                    }`}>
                        {attendanceLoading ? "Loading..." : attendanceStatus}
                    </span>
                    <button
                        type="button"
                        className="btn-secondary profile-btn"
                        onClick={() => navigate("/profile")}
                    >
                        👤 View Profile
                    </button>
                </div>
            </header>

            {/* ACTION FEEDBACK MESSAGES */}
            {actionMessage && (
                <div className="dashboard-alert success" role="status">
                    ✓ {actionMessage}
                </div>
            )}

            {attendanceError && (
                <div className="dashboard-alert error" role="alert">
                    <div className="alert-content">
                        <strong>Action Error:</strong> {attendanceError}
                    </div>
                    <button
                        type="button"
                        className="alert-retry-btn"
                        onClick={loadTodayAttendance}
                        disabled={attendanceLoading}
                    >
                        {attendanceLoading ? "Retrying..." : "↻ Retry"}
                    </button>
                </div>
            )}

            {/* 2. COMPACT ATTENDANCE SUMMARY CARDS */}
            <div className="dashboard-summary-grid">
                <div className="summary-card">
                    <div className="summary-icon blue">📋</div>
                    <div>
                        <span>Today's Status</span>
                        <strong>{attendanceLoading ? "Loading..." : attendanceStatus}</strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon green">↗</div>
                    <div>
                        <span>Check In</span>
                        <strong>{attendanceLoading ? "..." : formatTime(attendance?.checkInTime)}</strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon purple">↘</div>
                    <div>
                        <span>Check Out</span>
                        <strong>{attendanceLoading ? "..." : formatTime(attendance?.checkOutTime)}</strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon cyan">⏱️</div>
                    <div>
                        <span>Working Duration</span>
                        <strong style={{ color: attendance?.checkOutTime ? "#4ade80" : attendance?.checkInTime ? "#38bdf8" : "inherit" }}>
                            {attendanceLoading
                                ? "..."
                                : attendance?.checkOutTime
                                    ? (attendance?.workingDurationFormatted || durationInfo?.formatted || "—")
                                    : attendance?.checkInTime
                                        ? `${durationInfo?.formatted || "< 1 min"} (live)`
                                        : "—"}
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon amber">🛡️</div>
                    <div>
                        <span>Verification</span>
                        <strong>{attendanceLoading ? "..." : verificationBadgeText}</strong>
                    </div>
                </div>
            </div>

            {/* 3. PROMINENT RECORD ATTENDANCE CARD */}
            <section className="dashboard-card record-attendance-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">DAILY ATTENDANCE</span>
                        <h2>Record Attendance</h2>
                        <p>Authoritative server-timestamped check-in and check-out with multi-factor verification.</p>
                    </div>

                    <div className="location-readiness-pill">
                        <span className={`readiness-dot ${locationSupported && !locationError ? "dot-ready" : "dot-warning"}`} />
                        <span>
                            {locationLoading
                                ? "Acquiring GPS..."
                                : locationError
                                    ? "GPS Unavailable"
                                    : locationSupported
                                        ? "GPS Ready"
                                        : "Browser GPS Unsupported"}
                        </span>
                    </div>
                </div>

                <div className="record-attendance-body">
                    {/* STATE 1: READY TO CHECK IN */}
                    {canCheckIn && (
                        <div className="attendance-state-banner state-ready">
                            <div className="state-content">
                                <span className="state-badge">READY TO CHECK IN</span>
                                <h3>You have not checked in yet today</h3>
                                <p>
                                    Click <strong>Check In Now</strong> to record your start time. Your device coordinates, browser session, and schedule signals will be evaluated against university campus policies.
                                </p>
                            </div>
                            <div className="state-action-wrap">
                                <button
                                    type="button"
                                    className="btn-primary btn-lg"
                                    onClick={handleCheckIn}
                                    disabled={actionLoading || locationLoading}
                                >
                                    {actionLoading && actionType === "check-in"
                                        ? "Checking In..."
                                        : locationLoading
                                            ? "Reading GPS..."
                                            : "↗ Check In Now"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STATE 2: CHECK-IN IN PROGRESS */}
                    {actionLoading && actionType === "check-in" && (
                        <div className="attendance-state-banner state-progress">
                            <div className="state-content">
                                <span className="state-badge">CHECK-IN IN PROGRESS</span>
                                <h3>Verifying attendance signals...</h3>
                                <p>Communicating with the authoritative FacultyFlow server and persisting verified records to MongoDB.</p>
                            </div>
                        </div>
                    )}

                    {/* STATE 3: CHECKED IN / READY TO CHECK OUT */}
                    {canCheckOut && (
                        <div className="attendance-state-banner state-checked-in">
                            <div className="state-content">
                                <span className="state-badge badge-active">SESSION IN PROGRESS</span>
                                <h3>Checked In at {formatTime(attendance?.checkInTime)}</h3>
                                <p>
                                    Live Session Elapsed: <strong style={{ color: "#38bdf8" }}>{durationInfo?.formatted || "< 1 min"}</strong> (live). When you finish your workday or duties, submit check-out below to finalize duration.
                                </p>
                            </div>
                            <div className="state-action-wrap">
                                <button
                                    type="button"
                                    className="btn-primary btn-lg btn-checkout"
                                    onClick={handleCheckOut}
                                    disabled={actionLoading || locationLoading}
                                >
                                    {actionLoading && actionType === "check-out"
                                        ? "Checking Out..."
                                        : locationLoading
                                            ? "Reading GPS..."
                                            : "↘ Check Out Now"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STATE 4: CHECK-OUT IN PROGRESS */}
                    {actionLoading && actionType === "check-out" && (
                        <div className="attendance-state-banner state-progress">
                            <div className="state-content">
                                <span className="state-badge">CHECK-OUT IN PROGRESS</span>
                                <h3>Finalizing attendance session...</h3>
                                <p>Persisting workday completion and computing duration on the server.</p>
                            </div>
                        </div>
                    )}

                    {/* STATE 5: ATTENDANCE COMPLETED */}
                    {isAttendanceComplete && (
                        <div className="attendance-state-banner state-complete">
                            <div className="state-content">
                                <span className="state-badge badge-success">✓ COMPLETED</span>
                                <h3>Today's Attendance Complete</h3>
                                <p>
                                    Checked in at <strong>{formatTime(attendance.checkInTime)}</strong> &bull; Checked out at <strong>{formatTime(attendance.checkOutTime)}</strong> &bull; Total Working Duration: <strong style={{ color: "#4ade80" }}>{attendance.workingDurationFormatted || durationInfo?.formatted || "—"}</strong>.
                                </p>
                            </div>
                            <div className="state-action-wrap">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate("/attendance")}
                                >
                                    View Full History
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DETAILS STRIP */}
                    <div className="attendance-metadata-strip">
                        <div className="meta-item">
                            <span>Campus Date</span>
                            <strong>{attendance?.date || formatDate(new Date())}</strong>
                        </div>
                        <div className="meta-item">
                            <span>Working Duration</span>
                            <strong style={{ color: attendance?.checkOutTime ? "#4ade80" : attendance?.checkInTime ? "#38bdf8" : "inherit" }}>
                                {attendance?.checkOutTime
                                    ? (attendance?.workingDurationFormatted || durationInfo?.formatted || "—")
                                    : attendance?.checkInTime
                                        ? `${durationInfo?.formatted || "< 1 min"} (live)`
                                        : "—"}
                            </strong>
                        </div>
                        <div className="meta-item">
                            <span>Attendance ID</span>
                            <strong>{attendance?.attendanceId || "Generated at check-in"}</strong>
                        </div>
                        <div className="meta-item">
                            <span>Verification</span>
                            <strong>{verificationBadgeText}</strong>
                        </div>
                        <div className="meta-item">
                            <span>Sync Mode</span>
                            <strong>{attendance?.syncStatus || "REAL-TIME SYNCED"}</strong>
                        </div>
                        <div className="meta-item">
                            <span>Client Channel</span>
                            <strong>Web Application (HTTPS)</strong>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. REDESIGNED VERIFICATION STATUS PANEL */}
            <section className="dashboard-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">SECURITY & COMPLIANCE</span>
                        <h2>Multi-Factor Verification Panel</h2>
                        <p>Comprehensive signal evaluation performed by the FacultyFlow backend verification service.</p>
                    </div>
                </div>

                <VerificationStatusCard
                    verification={verification}
                    attendance={attendance}
                    onRefresh={loadTodayAttendance}
                    refreshing={attendanceLoading}
                />
            </section>

            {/* 5. CONCISE ATTENDANCE HISTORY PREVIEW */}
            <section className="dashboard-card history-preview-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">RECORDS</span>
                        <h2>Attendance History Summary</h2>
                        <p>Review past institutional attendance records, geofence compliance and verification audits.</p>
                    </div>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate("/attendance")}
                    >
                        View Full History &rarr;
                    </button>
                </div>

                <div className="history-preview-content">
                    {attendance ? (
                        <div className="today-record-preview">
                            <div className="record-preview-header">
                                <div>
                                    <span className="record-date">{formatDate(attendance.date)}</span>
                                    <span className="record-id">{attendance.attendanceId}</span>
                                </div>
                                <span className={`status-pill ${
                                    attendance.status === "Present"
                                        ? "status-present"
                                        : "status-pending"
                                }`}>
                                    {attendance.status || "Present"}
                                </span>
                            </div>
                            <div className="record-times-row">
                                <div>
                                    <span>Check In Time</span>
                                    <strong>{formatTime(attendance.checkInTime)}</strong>
                                </div>
                                <div>
                                    <span>Check Out Time</span>
                                    <strong>{formatTime(attendance.checkOutTime)}</strong>
                                </div>
                                <div>
                                    <span>Verification State</span>
                                    <strong>{attendance.verificationStatus || "Verified"}</strong>
                                </div>
                                <div>
                                    <span>Server Source</span>
                                    <strong>{attendance.source || "Web Client"}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="history-empty-prompt">
                            <p>No check-in recorded for today yet. Use the <strong>Record Attendance</strong> card above to begin your day.</p>
                        </div>
                    )}
                </div>
            </section>
        </section>
    );
}

export default FacultyDashboard;