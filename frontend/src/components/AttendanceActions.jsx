function AttendanceActions({
    attendance,
    checkIn,
    checkOut,
    isProcessing
}) {
    const checkedIn = Boolean(
        attendance?.checkInTime
    );

    const checkedOut = Boolean(
        attendance?.checkOutTime
    );

    return (
        <section className="action-card">

            <div>
                <span className="card-label">
                    ATTENDANCE ACTION
                </span>

                <h2>
                    {checkedOut
                        ? "Attendance completed"
                        : checkedIn
                            ? "You're checked in"
                            : "Ready to check in?"}
                </h2>

                <p>
                    {checkedOut
                        ? "Today's attendance cycle is complete."
                        : checkedIn
                            ? "You can check out when your working day is complete."
                            : "Complete the configured verification checks before recording attendance."}
                </p>
            </div>

            <div className="attendance-buttons">

                {!checkedIn && !checkedOut && (
                    <button
                        className="primary-button action-button"
                        onClick={checkIn}
                        disabled={isProcessing}
                    >
                        {isProcessing
                            ? "Verifying..."
                            : "Check In"}
                    </button>
                )}

                {checkedIn && !checkedOut && (
                    <button
                        className="secondary-button action-button"
                        onClick={checkOut}
                        disabled={isProcessing}
                    >
                        {isProcessing
                            ? "Verifying..."
                            : "Check Out"}
                    </button>
                )}

                {checkedOut && (
                    <div className="completed-badge">
                        ✓ Attendance Completed
                    </div>
                )}

            </div>

        </section>
    );
}

export default AttendanceActions;