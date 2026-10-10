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

            {/* ATTENDANCE WINDOW */}

            <div className="policy-form-grid">

                <div className="form-group">

                    <label>
                        Check-in Start Time
                    </label>

                    <input
                        type="time"
                        value={
                            policy.checkInStartTime
                        }
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
                        value={
                            policy.checkInEndTime
                        }
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
                        Grace Period
                    </label>

                    <input
                        type="number"
                        min="0"
                        max="120"
                        value={
                            policy.gracePeriodMinutes
                        }
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