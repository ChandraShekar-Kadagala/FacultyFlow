function AttendanceTable({
    records,
    facultyMap,
    onViewFaculty
}) {

    if (
        !records ||
        records.length === 0
    ) {

        return (

            <div className="attendance-empty-state">

                <div className="attendance-empty-icon">
                    ◌
                </div>

                <h3>
                    No attendance records found
                </h3>

                <p>
                    Try changing or clearing
                    your filters.
                </p>

            </div>
        );
    }


    return (

        <div className="table-wrapper">

            <table className="attendance-management-table">

                <thead>

                    <tr>

                        <th>
                            Faculty
                        </th>

                        <th>
                            Department
                        </th>

                        <th>
                            Course
                        </th>

                        <th>
                            Date
                        </th>

                        <th>
                            Check-in
                        </th>

                        <th>
                            Check-out
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Verification
                        </th>

                        <th>
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {
                        records.map(
                            record => {

                                const faculty =
                                    facultyMap[
                                        record.facultyId
                                    ];

                                const verification =
                                    record
                                        .verificationStatus ||
                                    "Pending";

                                const course =
                                    faculty?.course ||
                                    record.course ||
                                    "-";

                                const department =
                                    faculty?.department ||
                                    record.department ||
                                    "-";


                                return (

                                    <tr
                                        key={
                                            record.id ||
                                            record.attendanceId ||
                                            `${record.facultyId}-${record.date}`
                                        }
                                    >

                                        {/* FACULTY */}

                                        <td>

                                            <div className="faculty-info">

                                                <div className="faculty-avatar">

                                                    {
                                                        faculty?.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                        "F"
                                                    }

                                                </div>


                                                <div>

                                                    <strong>
                                                        {
                                                            faculty?.name ||
                                                            "Unknown Faculty"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            record.facultyId
                                                        }
                                                    </span>

                                                </div>

                                            </div>

                                        </td>


                                        {/* DEPARTMENT */}

                                        <td>
                                            {department}
                                        </td>


                                        {/* COURSE */}

                                        <td>
                                            {course}
                                        </td>


                                        {/* DATE */}

                                        <td>
                                            {
                                                record.date ||
                                                "-"
                                            }
                                        </td>


                                        {/* CHECK-IN */}

                                        <td>
                                            {
                                                record.checkInTime ||
                                                "-"
                                            }
                                        </td>


                                        {/* CHECK-OUT */}

                                        <td>
                                            {
                                                record.checkOutTime ||
                                                "-"
                                            }
                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={
                                                    `status-badge ${
                                                        (
                                                            record.status ||
                                                            "Unknown"
                                                        ).toLowerCase()
                                                    }`
                                                }
                                            >
                                                {
                                                    record.status ||
                                                    "Unknown"
                                                }
                                            </span>

                                        </td>


                                        {/* VERIFICATION */}

                                        <td>

                                            <span
                                                className={
                                                    `status-badge ${
                                                        verification
                                                            .toLowerCase()
                                                    }`
                                                }
                                            >
                                                {
                                                    verification
                                                }
                                            </span>

                                        </td>


                                        {/* ACTION */}

                                        <td>

                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() =>
                                                    onViewFaculty(
                                                        record.facultyId
                                                    )
                                                }
                                            >
                                                View Faculty
                                            </button>

                                        </td>

                                    </tr>
                                );
                            }
                        )
                    }

                </tbody>

            </table>

        </div>
    );
}


export default AttendanceTable;