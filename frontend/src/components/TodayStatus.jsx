function TodayStatus({ attendance }) {
    const status = attendance?.status || "Not Checked In";

    const statusClass =
        status === "Present"
            ? "status-present"
            : status === "Late"
                ? "status-late"
                : "status-pending";

    return (
        <section className="dashboard-card">

            <div className="card-header">
                <div>
                    <span className="card-label">
                        TODAY
                    </span>

                    <h2>Attendance Status</h2>
                </div>

                <span className={`status-pill ${statusClass}`}>
                    {status}
                </span>
            </div>

            <div className="attendance-times">

                <div className="time-item">
                    <span>Check In</span>

                    <strong>
                        {attendance?.checkInTime || "--:--"}
                    </strong>
                </div>

                <div className="time-divider" />

                <div className="time-item">
                    <span>Check Out</span>

                    <strong>
                        {attendance?.checkOutTime || "--:--"}
                    </strong>
                </div>

            </div>

            <div className="attendance-date">
                {attendance?.date}
            </div>

        </section>
    );
}

export default TodayStatus;