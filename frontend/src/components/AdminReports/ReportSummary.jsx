const DEFAULT_SUMMARY = {
    totalRecords: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    verifiedCount: 0,
    pendingVerificationCount: 0,
    attendanceRate: 0,
    verificationRate: 0
};


function ReportSummary({
    summary = DEFAULT_SUMMARY
}) {
    const safeSummary = {
        ...DEFAULT_SUMMARY,
        ...(summary || {})
    };

    const cards = [
        {
            label: "Total Records",
            value: safeSummary.totalRecords
        },
        {
            label: "Present",
            value: safeSummary.presentCount
        },
        {
            label: "Late",
            value: safeSummary.lateCount
        },
        {
            label: "Absent",
            value: safeSummary.absentCount
        },
        {
            label: "Verified",
            value: safeSummary.verifiedCount
        },
        {
            label: "Pending Verification",
            value:
                safeSummary.pendingVerificationCount
        },
        {
            label: "Attendance Rate",
            value:
                `${safeSummary.attendanceRate}%`
        },
        {
            label: "Verification Rate",
            value:
                `${safeSummary.verificationRate}%`
        }
    ];

    return (
        <section className="report-summary-grid">

            {cards.map(card => (
                <article
                    className="admin-stat-card"
                    key={card.label}
                >
                    <div className="stat-icon blue">
                        •
                    </div>

                    <div>
                        <span>
                            {card.label}
                        </span>

                        <strong>
                            {card.value}
                        </strong>

                        <p>
                            Report metric
                        </p>
                    </div>
                </article>
            ))}

        </section>
    );
}


export default ReportSummary;