const verificationLabels = {
    identity: "Identity",
    biometric: "Device Biometric",
    network: "University Network",
    location: "Campus Location",
    schedule: "Schedule & Time"
};

function VerificationStatus({ verification }) {
    const checks = Object.keys(verificationLabels);

    const passedCount = checks.filter(
        key => verification?.[key] === true
    ).length;

    return (
        <section className="dashboard-card">

            <div className="card-header">

                <div>
                    <span className="card-label">
                        VERIFICATION
                    </span>

                    <h2>Attendance Checks</h2>
                </div>

                <span className="demo-badge">
                    DEMO MODE
                </span>

            </div>

            <p className="verification-note">
                These checks are frontend demo signals.
                Real biometric, network and location
                verification will be implemented through
                the target device and backend.
            </p>

            <div className="verification-list">

                {checks.map(key => {
                    const passed =
                        verification?.[key] === true;

                    return (
                        <div
                            className="verification-item"
                            key={key}
                        >
                            <div className="verification-icon">
                                {passed ? "✓" : "!"}
                            </div>

                            <div>
                                <strong>
                                    {verificationLabels[key]}
                                </strong>

                                <span>
                                    {passed
                                        ? "Passed"
                                        : "Failed"}
                                </span>
                            </div>

                            <span
                                className={
                                    passed
                                        ? "check-status passed"
                                        : "check-status failed"
                                }
                            >
                                {passed
                                    ? "PASS"
                                    : "FAIL"}
                            </span>
                        </div>
                    );
                })}

            </div>

            <div className="verification-summary">
                {passedCount}/{checks.length} checks passed
            </div>

        </section>
    );
}

export default VerificationStatus;