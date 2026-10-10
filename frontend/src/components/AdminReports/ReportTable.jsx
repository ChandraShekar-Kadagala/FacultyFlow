function ReportTable({
    records = []
}) {
    return (
        <section className="dashboard-card">

            <div className="card-header">
                <div>
                    <span className="card-label">
                        REPORT DATA
                    </span>

                    <h2>
                        Attendance Records
                    </h2>

                    <p>
                        Attendance records matching
                        the selected filters.
                    </p>
                </div>
            </div>

            <div className="report-table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>Faculty</th>
                            <th>Employee Code</th>
                            <th>Department</th>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                            <th>Verification</th>
                        </tr>
                    </thead>

                    <tbody>

                        {records.map(record => (
                            <tr
                                key={record.id}
                            >
                                <td>
                                    {record.facultyName ||
                                        record.facultyId ||
                                        "-"}
                                </td>

                                <td>
                                    {record.employeeCode ||
                                        "-"}
                                </td>

                                <td>
                                    {record.department ||
                                        "-"}
                                </td>

                                <td>
                                    {record.date ||
                                        "-"}
                                </td>

                                <td>
                                    {record.checkInTime ||
                                        "-"}
                                </td>

                                <td>
                                    {record.checkOutTime ||
                                        "-"}
                                </td>

                                <td>
                                    {record.status ||
                                        "-"}
                                </td>

                                <td>
                                    {record.verificationStatus ||
                                        "Pending"}
                                </td>
                            </tr>
                        ))}

                        {records.length === 0 && (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="report-empty-state"
                                >
                                    No attendance records
                                    found.
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

        </section>
    );
}

export default ReportTable;