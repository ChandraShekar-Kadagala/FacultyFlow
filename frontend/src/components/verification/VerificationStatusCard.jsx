import {
    useMemo
} from "react";

import {
    normalizeVerificationResult
} from "../../services/verification/verificationNormalizer";


// ============================================================
// RESULT CONFIGURATION
// ============================================================

const RESULT_CONFIG = {

    VERIFIED: {
        label: "Verified",
        className: "verified",
        icon: "✓"
    },

    FAILED: {
        label: "Failed",
        className: "failed",
        icon: "!"
    },

    PENDING: {
        label: "Pending",
        className: "pending",
        icon: "…"
    },

    AWAITING_CHECK_IN: {
        label: "Awaiting Check-In",
        className: "pending",
        icon: "⏳"
    },

    UNAVAILABLE: {
        label: "Unavailable",
        className: "unavailable",
        icon: "—"
    }

};


// ============================================================
// COMPONENT
// ============================================================

function VerificationStatusCard({
    verification
}) {

    const normalized =
        useMemo(
            () =>
                normalizeVerificationResult(
                    verification
                ),
            [
                verification
            ]
        );


    const overallConfig =
        RESULT_CONFIG[
            normalized.overallResult
        ] ||
        RESULT_CONFIG.UNAVAILABLE;


    return (

        <div className="verification-status-card">

            {/* ==================================================
                OVERALL VERIFICATION
            ================================================== */}

            <div className="verification-overall">

                <div className="verification-overall-content">

                    <span className="card-label">
                        OVERALL VERIFICATION
                    </span>

                    <h3>
                        Attendance Verification
                    </h3>

                    {normalized.reason && (

                        <p>
                            {normalized.reason}
                        </p>

                    )}

                </div>


                <span
                    className={
                        `verification-result-badge ${overallConfig.className}`
                    }
                >

                    <span>
                        {overallConfig.icon}
                    </span>

                    {overallConfig.label}

                </span>

            </div>


            {/* ==================================================
                INDIVIDUAL CHECKS
            ================================================== */}

            <div className="verification-check-grid">

                {normalized.checks.map(
                    check => {

                        const config =
                            RESULT_CONFIG[
                                check.result
                            ] ||
                            RESULT_CONFIG.UNAVAILABLE;


                        return (

                            <div
                                className="verification-check"
                                key={check.type}
                            >

                                <div className="verification-check-header">

                                    <span className="verification-check-name">
                                        {check.label}
                                    </span>


                                    <span
                                        className={
                                            `verification-check-status ${config.className}`
                                        }
                                    >

                                        {config.icon}{" "}

                                        {config.label}

                                    </span>

                                </div>


                                {check.reason && (

                                    <p className="verification-check-reason">
                                        {check.reason}
                                    </p>

                                )}

                            </div>

                        );

                    }
                )}

            </div>


            {/* ==================================================
                PRIVACY NOTE
            ================================================== */}

            <div className="verification-privacy-note">

                Verification status is calculated by the
                FacultyFlow backend. The client does not make
                attendance approval decisions.

            </div>

        </div>

    );

}


export default VerificationStatusCard;