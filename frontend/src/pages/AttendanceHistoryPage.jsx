import {
    useEffect,
    useState
} from "react";

import useAuth from "../hooks/useAuth";

import {
    getAttendanceHistory
} from "../services/attendance/attendanceService";


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(
    value
) {

    if (!value) {

        return "--:--";

    }


    return new Date(
        value
    ).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// FACULTY ATTENDANCE HISTORY PAGE
// ============================================================

function AttendanceHistoryPage() {

    const {
        user,
        accessToken
    } = useAuth();


    // ========================================================
    // STATE
    // ========================================================

    const [
        records,
        setRecords
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    // ========================================================
    // LOAD HISTORY
    // ========================================================

    useEffect(() => {

        async function loadAttendanceHistory() {

            setLoading(true);

            setError("");


            try {

                const response =
                    await getAttendanceHistory(
                        accessToken
                    );


                setRecords(
                    response.records || []
                );

            } catch (error) {

                console.error(
                    "Failed to load attendance history:",
                    error
                );


                setError(
                    error.message ||
                    "Failed to load attendance history."
                );

            } finally {

                setLoading(false);

            }

        }


        if (accessToken) {

            loadAttendanceHistory();

        } else {

            setLoading(false);

            setError(
                "Authentication session is missing."
            );

        }

    }, [accessToken]);


    // ========================================================
    // FACULTY ID
    // ========================================================

    const facultyId =
        user?.facultyId || "--";


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <section className="faculty-dashboard">


            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        FACULTY WORKSPACE
                    </span>


                    <h1>
                        Attendance History
                    </h1>


                    <p>
                        View your attendance records
                        from the system.
                    </p>

                </div>


                <div>

                    <span>
                        Faculty ID
                    </span>


                    <strong>
                        {facultyId}
                    </strong>

                </div>

            </div>


            {/* ==================================================
                HISTORY CARD
            ================================================== */}

            <section className="dashboard-card">


                <div className="card-header">

                    <div>

                        <span className="card-label">
                            ATTENDANCE RECORDS
                        </span>


                        <h2>
                            Your Attendance
                        </h2>


                        <p>
                            Attendance records retrieved
                            from the server.
                        </p>

                    </div>


                    {!loading &&
                        !error && (

                            <span>
                                {records.length}{" "}
                                record
                                {records.length !== 1
                                    ? "s"
                                    : ""}
                            </span>

                        )}

                </div>


                {/* ==================================================
                    LOADING
                ================================================== */}

                {loading && (

                    <div className="action-message">

                        Loading attendance history...

                    </div>

                )}


                {/* ==================================================
                    ERROR
                ================================================== */}

                {!loading && error && (

                    <div className="action-message">

                        {error}

                    </div>

                )}


                {/* ==================================================
                    TABLE
                ================================================== */}

                {!loading &&
                    !error && (

                        <div className="table-wrapper">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Check In
                                        </th>

                                        <th>
                                            Check Out
                                        </th>

                                        <th>
                                            Verification
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {records.length > 0 ? (

                                        records.map(
                                            record => (

                                                <tr
                                                    key={
                                                        record.attendanceId
                                                    }
                                                >

                                                    <td>
                                                        {record.date}
                                                    </td>


                                                    <td>

                                                        <span
                                                            className={`status-badge ${
                                                                record.status
                                                                    ?.toLowerCase()
                                                            }`}
                                                        >

                                                            {record.status}

                                                        </span>

                                                    </td>


                                                    <td>

                                                        {formatTime(
                                                            record.checkInTime
                                                        )}

                                                    </td>


                                                    <td>

                                                        {formatTime(
                                                            record.checkOutTime
                                                        )}

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={`status-badge ${
                                                                record.verificationStatus ===
                                                                "Verified"
                                                                    ? "verified"
                                                                    : "pending"
                                                            }`}
                                                        >

                                                            {
                                                                record.verificationStatus ||
                                                                "Pending"
                                                            }

                                                        </span>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                className="empty-table"
                                            >

                                                No attendance
                                                records found.

                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

            </section>

        </section>

    );

}


export default AttendanceHistoryPage;