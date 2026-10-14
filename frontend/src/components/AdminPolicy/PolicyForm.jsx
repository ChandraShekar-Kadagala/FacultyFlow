function PolicyForm({
    policy,
    errors,
    onChange,
    onToggle,
    onSave,
    onReset,
    saving
}) {

    return (
        <div className="policy-form">

            {/* ATTENDANCE MODE */}
            <div className="policy-mode-selector" style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.95rem" }}>
                    Attendance Tracking Mode
                </span>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                            type="radio"
                            name="attendanceMode"
                            value="FLEXIBLE"
                            checked={policy.attendanceMode !== "SCHEDULED"}
                            onChange={() => {
                                onChange("attendanceMode", "FLEXIBLE");
                                onChange("scheduleVerification", false);
                            }}
                        />
                        <span>
                            <strong>Flexible Attendance (Default)</strong>
                            <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #94a3b8)" }}>
                                Faculty can check in at any time on working days. Working duration is tracked automatically.
                            </span>
                        </span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                            type="radio"
                            name="attendanceMode"
                            value="SCHEDULED"
                            checked={policy.attendanceMode === "SCHEDULED"}
                            onChange={() => {
                                onChange("attendanceMode", "SCHEDULED");
                                onChange("scheduleVerification", true);
                            }}
                        />
                        <span>
                            <strong>Scheduled Window</strong>
                            <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #94a3b8)" }}>
                                Strict fixed check-in start and end window with grace period enforcement.
                            </span>
                        </span>
                    </label>
                </div>
            </div>

            {/* ATTENDANCE WINDOW / TARGET HOURS */}
            {policy.attendanceMode !== "SCHEDULED" ? (
                <div className="policy-form-grid" style={{ marginBottom: "1.5rem" }}>
                    <div className="form-group">
                        <label>
                            Target Working Hours / Day
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="24"
                            value={policy.minWorkingHours ?? 8}
                            onChange={event =>
                                onChange(
                                    "minWorkingHours",
                                    event.target.value
                                )
                            }
                        />
                        <span className="form-help">
                            Standard daily faculty working duration target (e.g. 8 hours)
                        </span>
                        {errors.minWorkingHours && (
                            <span className="form-error">
                                {errors.minWorkingHours}
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="policy-form-grid" style={{ marginBottom: "1.5rem" }}>
                    <div className="form-group">
                        <label>
                            Check-in Start Time
                        </label>
                        <input
                            type="time"
                            value={policy.checkInStartTime || ""}
                            onChange={event =>
                                onChange(
                                    "checkInStartTime",
                                    event.target.value
                                )
                            }
                        />
                        {errors.checkInStartTime && (
                            <span className="form-error">
                                {errors.checkInStartTime}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>
                            Check-in End Time
                        </label>
                        <input
                            type="time"
                            value={policy.checkInEndTime || ""}
                            onChange={event =>
                                onChange(
                                    "checkInEndTime",
                                    event.target.value
                                )
                            }
                        />
                        {errors.checkInEndTime && (
                            <span className="form-error">
                                {errors.checkInEndTime}
                            </span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>
                            Grace Period (Minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="120"
                            value={policy.gracePeriodMinutes ?? 0}
                            onChange={event =>
                                onChange(
                                    "gracePeriodMinutes",
                                    event.target.value
                                )
                            }
                        />
                        <span className="form-help">
                            Allowed range: 0–120 minutes
                        </span>
                        {errors.gracePeriodMinutes && (
                            <span className="form-error">
                                {errors.gracePeriodMinutes}
                            </span>
                        )}
                    </div>
                </div>
            )}


            {/* VERIFICATION */}

            <div className="policy-verification-grid">

                <label className="policy-toggle">

                    <div>
                        <strong>
                            Identity Verification
                        </strong>

                        <span>
                            Require authenticated faculty identity.
                        </span>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                policy.identityVerification
                            )
                        }
                        onChange={() =>
                            onToggle(
                                "identityVerification"
                            )
                        }
                    />

                </label>


                <label className="policy-toggle">

                    <div>
                        <strong>
                            Biometric Verification
                        </strong>

                        <span>
                            Use supported device biometric verification.
                        </span>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                policy.biometricVerification
                            )
                        }
                        onChange={() =>
                            onToggle(
                                "biometricVerification"
                            )
                        }
                    />

                </label>


                <label className="policy-toggle">

                    <div>
                        <strong>
                            Network Verification
                        </strong>

                        <span>
                            Require configured university network verification.
                        </span>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                policy.networkVerification
                            )
                        }
                        onChange={() =>
                            onToggle(
                                "networkVerification"
                            )
                        }
                    />

                </label>


                <label className="policy-toggle">

                    <div>
                        <strong>
                            Location Verification
                        </strong>

                        <span>
                            Require configured campus location validation.
                        </span>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                policy.locationVerification
                            )
                        }
                        onChange={() =>
                            onToggle(
                                "locationVerification"
                            )
                        }
                    />

                </label>


                <label className="policy-toggle">

                    <div>
                        <strong>
                            Schedule Verification
                        </strong>

                        <span>
                            Enforce attendance check-in window and schedule compliance.
                        </span>
                    </div>

                    <input
                        type="checkbox"
                        checked={
                            Boolean(
                                policy.scheduleVerification
                            )
                        }
                        onChange={() =>
                            onToggle(
                                "scheduleVerification"
                            )
                        }
                    />

                </label>

            </div>


            {errors.requiredVerification && (
                <div className="form-error policy-global-error">
                    {errors.requiredVerification}
                </div>
            )}


            {/* ACTIONS */}

            <div className="policy-form-actions">

                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onReset}
                    disabled={saving}
                >
                    Reset
                </button>


                <button
                    type="button"
                    className="btn-primary"
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Policy"}
                </button>

            </div>

        </div>
    );
}

export default PolicyForm;