import { useMemo, useState } from "react";
import { attendanceHistory } from "../data/mockData";

function AttendanceHistoryPage() {
    const [statusFilter, setStatusFilter] = useState("All");

    const filteredRecords = useMemo(() => {
        if (statusFilter === "All") {
            return attendanceHistory;
        }

        return attendanceHistory.filter(
            record => record.status === statusFilter
        );
    }, [statusFilter]);

    return (
        <section className="page-card">

            <div className="page-header">

                <div>
                    <span className="eyebrow">
                        ATTENDANCE
                    </span>

                    <h1>
                        Attendance History
                    </h1>

                    <p>
                        View and verify your previous attendance records.
                    </p>
                </div>

                <div className="filter-group">

                    <label htmlFor="status-filter">
                        Status
                    </label>

                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="All">
                            All
                        </option>

                        <option value="Present">
                            Present
                        </option>

                        <option value="Late">
                            Late
                        </option>
                    </select>

                </div>

            </div>

            {filteredRecords.length === 0 ? (
                <div className="empty-state">
                    <h2>
                        No attendance records
                    </h2>

                    <p>
                        No records match the selected filter.
                    </p>
                </div>
            ) : (
                <div className="table-container">

                    <table className="attendance-table">

                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Verification</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredRecords.map(record => (
                                <tr key={record.id}>

                                    <td>
                                        {record.date}
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                record.status === "Present"
                                                    ? "status-pill status-present"
                                                    : "status-pill status-late"
                                            }
                                        >
                                            {record.status}
                                        </span>
                                    </td>

                                    <td>
                                        {record.checkInTime || "-"}
                                    </td>

                                    <td>
                                        {record.checkOutTime || "-"}
                                    </td>

                                    <td>
                                        <span className="verification-pill">
                                            {record.verificationStatus}
                                        </span>
                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>
            )}

        </section>
    );
}

export default AttendanceHistoryPage;