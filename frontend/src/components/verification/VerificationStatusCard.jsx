import { useMemo } from "react";
import { normalizeVerificationResult } from "../../services/verification/verificationNormalizer";

const RESULT_CONFIG = {
    VERIFIED: {
        label: "Verified",
        className: "badge-verified",
        icon: "✓"
    },
    FAILED: {
        label: "Failed",
        className: "badge-failed",
        icon: "!"
    },
    PENDING: {
        label: "Pending",
        className: "badge-pending",
        icon: "…"
    },
    AWAITING_CHECK_IN: {
        label: "Not Yet Evaluated",
        className: "badge-awaiting",
        icon: "⏳"
    },
    UNAVAILABLE: {
        label: "Unavailable",
        className: "badge-unavailable",
        icon: "—"
    }
};

const SIGNAL_ICONS = {
    IDENTITY: "👤",
    SCHEDULE: "🕒",
    LOCATION: "📍",
    DEVICE: "📱",
    NETWORK: "📶"
};

function VerificationStatusCard({
    verification,
    attendance,
    onRefresh,
    refreshing = false
}) {
    const isCheckedIn = Boolean(attendance?.checkInTime);

    const normalized = useMemo(() => {
        return normalizeVerificationResult(verification);
    }, [verification]);

    const overallKey = !isCheckedIn
        ? "AWAITING_CHECK_IN"
        : (normalized.overallResult || "UNAVAILABLE");

    const overallConfig = RESULT_CONFIG[overallKey] || RESULT_CONFIG.UNAVAILABLE;

    return (
        <div className="verification-panel">
            {/* OVERALL BANNER */}
            <div className={`verification-banner ${overallConfig.className}`}>
                <div className="banner-icon-col">
                    <span className="banner-status-icon">{overallConfig.icon}</span>
                </div>
                <div className="banner-content">
                    <div className="banner-meta">
                        <span className="banner-badge">{overallConfig.label}</span>
                        {normalized.sessionId && (
                            <span className="banner-session-id">
                                Session: <code>{normalized.sessionId}</code>
                            </span>
                        )}
                        {onRefresh && (
                            <button
                                type="button"
                                className="banner-refresh-btn"
                                onClick={onRefresh}
                                disabled={refreshing}
                                title="Refetch verification records from server"
                            >
                                {refreshing ? "Refreshing..." : "↻ Refresh"}
                            </button>
                        )}
                    </div>
                    <h4>
                        {!isCheckedIn
                            ? "Verification Evaluated Upon Attendance Submission"
                            : normalized.overallResult === "VERIFIED"
                                ? "Attendance Cryptographically & Policy Verified"
                                : "Attendance Verification Status Received"}
                    </h4>
                    <p>
                        {!isCheckedIn
                            ? "All five security signals (identity, institutional schedule, campus geofence, device integrity, and network) are captured and evaluated by the authoritative server when you submit Check In."
                            : normalized.reason}
                    </p>
                </div>
            </div>

            {/* INDIVIDUAL SIGNAL CARDS */}
            <div className="verification-signals-grid">
                {normalized.checks.map(check => {
                    const statusKey = !isCheckedIn
                        ? "AWAITING_CHECK_IN"
                        : (check.result || "UNAVAILABLE");
                    const statusCfg = RESULT_CONFIG[statusKey] || RESULT_CONFIG.UNAVAILABLE;
                    const icon = SIGNAL_ICONS[check.type] || "🔹";

                    return (
                        <div className="signal-card" key={check.type}>
                            <div className="signal-card-header">
                                <div className="signal-title-wrap">
                                    <span className="signal-glyph">{icon}</span>
                                    <div>
                                        <strong>{check.label}</strong>
                                        <span className="signal-desc">{check.description}</span>
                                    </div>
                                </div>
                                <span className={`signal-status-pill ${statusCfg.className}`}>
                                    {statusCfg.icon} {statusCfg.label}
                                </span>
                            </div>

                            <div className="signal-card-body">
                                <p className="signal-observation">
                                    {!isCheckedIn
                                        ? check.reason
                                        : (check.reason || "Signal observation recorded by server.")}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FOOTER NOTICE */}
            <div className="verification-panel-footer">
                <span className="footer-shield">🛡️</span>
                <span>
                    Verification authority is enforced strictly server-side by MongoDB Atlas & Express. Web and mobile clients cannot bypass or self-sign attendance policy evaluation.
                </span>
            </div>
        </div>
    );
}

export default VerificationStatusCard;