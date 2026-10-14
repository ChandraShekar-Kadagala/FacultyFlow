import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import useAuth
    from "../hooks/useAuth";

import {
    getAdminAttendance
} from "../services/admin/attendanceService";


// ============================================================
// STATUS OPTIONS
// ============================================================

const STATUS_OPTIONS = [

    "Present",

    "Completed",

    "Late",

    "Absent",

    "Incomplete"

];


// ============================================================
// VERIFICATION OPTIONS
// ============================================================

const VERIFICATION_OPTIONS = [

    "Verified",

    "Pending",

    "Failed"

];


// ============================================================
// FORMAT DATE/TIME
// ============================================================

function formatTime(
    value
) {

    if (!value) {

        return "-";

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
// ADMIN ATTENDANCE MANAGEMENT PAGE
// ============================================================

function AttendanceManagementPage() {

    const navigate =
        useNavigate();


    const {
        accessToken
    } = useAuth();


    // ========================================================
    // RECORDS
    // ========================================================

    const [
        records,
        setRecords
    ] = useState([]);


    // ========================================================
    // LOADING
    // ========================================================

    const [
        loading,
        setLoading
    ] = useState(true);


    // ========================================================
    // ERROR
    // ========================================================

    const [
        error,
        setError
    ] = useState("");


    // ========================================================
    // SEARCH
    // ========================================================

    const [
        searchTerm,
        setSearchTerm
    ] = useState("");


    // ========================================================
    // DATE FILTER
    // ========================================================

    const [
        dateFilter,
        setDateFilter
    ] = useState("");


    // ========================================================
    // STATUS FILTER
    // ========================================================

    const [
        statusFilter,
        setStatusFilter
    ] = useState("ALL");


    // ========================================================
    // VERIFICATION FILTER
    // ========================================================

    const [
        verificationFilter,
        setVerificationFilter
    ] = useState("ALL");


    // ========================================================
    // LOAD ATTENDANCE
    // ========================================================

    useEffect(() => {

        async function loadAttendance() {

            setLoading(true);

            setError("");


            try {

                const response =
                    await getAdminAttendance(
                        accessToken,
                        {
                            search:
                                searchTerm.trim(),

                            date:
                                dateFilter,

                            status:
                                statusFilter,

                            verificationStatus:
                                verificationFilter
                        }
                    );


                setRecords(
                    response.records || []
                );

            } catch (error) {

                console.error(
                    "Failed to load admin attendance:",
                    error
                );


                setError(
                    error.message ||
                    "Failed to load attendance records."
                );


                setRecords([]);

            } finally {

                setLoading(false);

            }

        }


        if (accessToken) {

            loadAttendance();

        } else {

            setLoading(false);

            setError(
                "Authentication session is missing."
            );

        }

    }, [
        accessToken,
        searchTerm,
        dateFilter,
        statusFilter,
        verificationFilter
    ]);


    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    function clearFilters() {

        setSearchTerm("");

        setDateFilter("");

        setStatusFilter("ALL");

        setVerificationFilter("ALL");

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <section className="admin-dashboard">


            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        ATTENDANCE MANAGEMENT
                    </span>


                    <h1>
                        Attendance Management
                    </h1>


                    <p>
                        Monitor and review faculty
                        attendance records.
                    </p>

                </div>


                <div>

                    <strong>
                        {loading
                            ? "..."
                            : records.length}
                    </strong>


                    <span>
                        {" "}records
                    </span>

                </div>

            </div>


            {/* ==================================================
                MAIN CARD
            ================================================== */}

            <section className="dashboard-card">


                <div className="card-header">

                    <div>

                        <span className="card-label">
                            ATTENDANCE RECORDS
                        </span>


                        <h2>
                            Attendance History
                        </h2>


                        <p>
                            Search and filter attendance
                            activity from MongoDB.
                        </p>

                    </div>

                </div>


                {/* ==================================================
                    FILTERS
                ================================================== */}

                <div className="attendance-management-filters">


                    {/* SEARCH */}

                    <input
                        type="search"
                        placeholder="Search faculty, ID or department..."
                        value={searchTerm}
                        onChange={event =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                    />


                    {/* DATE */}

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={event =>
                            setDateFilter(
                                event.target.value
                            )
                        }
                    />


                    {/* STATUS */}

                    <select
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Status
                        </option>


                        {STATUS_OPTIONS.map(
                            status => (

                                <option
                                    key={status}
                                    value={status}
                                >

                                    {status}

                                </option>

                            )
                        )}

                    </select>


                    {/* VERIFICATION */}

                    <select
                        value={
                            verificationFilter
                        }
                        onChange={event =>
                            setVerificationFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Verification
                        </option>


                        {VERIFICATION_OPTIONS.map(
                            verification => (

                                <option
                                    key={verification}
                                    value={verification}
                                >

                                    {verification}

                                </option>

                            )
                        )}

                    </select>


                    {/* CLEAR */}

                    <button
                        className="btn-secondary"
                        onClick={clearFilters}
                    >

                        Clear Filters

                    </button>

                </div>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="action-message">

                        {error}

                    </div>

                )}


                {/* ==================================================
                    TABLE
                ================================================== */}

                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Department
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Check In
                                </th>

                                <th>
                                    Check Out
                                </th>

                                <th>
                                    Working Duration
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


                            {/* ======================================
                                LOADING
                            ====================================== */}

                            {loading && (

                                <tr>

                                    <td
                                        colSpan="9"
                                        className="empty-table"
                                    >

                                        Loading attendance
                                        records...

                                    </td>

                                </tr>

                            )}


                            {/* ======================================
                                RECORDS
                            ====================================== */}

                            {!loading &&
                                !error &&
                                records.map(
                                    record => {

                                        const faculty =
                                            record.faculty;


                                        const verification =
                                            record.verificationStatus ||
                                            "Pending";


                                        return (

                                            <tr
                                                key={
                                                    record.attendanceId
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

                                                    {
                                                        faculty?.department ||
                                                        "-"
                                                    }

                                                </td>


                                                {/* DATE */}

                                                <td>

                                                    {
                                                        record.date
                                                    }

                                                </td>


                                                {/* CHECK IN */}

                                                <td>

                                                    {
                                                        formatTime(
                                                            record.checkInTime
                                                        )
                                                    }

                                                </td>


                                                {/* CHECK OUT */}

                                                <td>

                                                    {
                                                        formatTime(
                                                            record.checkOutTime
                                                        )
                                                    }

                                                </td>


                                                {/* WORKING DURATION */}

                                                <td>

                                                    {record.checkOutTime ? (
                                                        <span style={{ fontWeight: 600 }}>
                                                            {record.workingDurationFormatted || "—"}
                                                        </span>
                                                    ) : record.checkInTime ? (
                                                        <span style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                                                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#38bdf8", display: "inline-block" }}></span>
                                                            {record.elapsedFormatted || "< 1 min"} (live)
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`status-badge ${
                                                            record.status
                                                                ?.toLowerCase()
                                                        }`}
                                                    >

                                                        {
                                                            record.status
                                                        }

                                                    </span>

                                                </td>


                                                {/* VERIFICATION */}

                                                <td>

                                                    <span
                                                        className={`status-badge ${
                                                            verification
                                                                .toLowerCase()
                                                        }`}
                                                    >

                                                        {
                                                            verification
                                                        }

                                                    </span>

                                                </td>


                                                {/* ACTION */}

                                                <td>

                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() =>
                                                            navigate(
                                                                `/faculty/${record.facultyId}`
                                                            )
                                                        }
                                                    >

                                                        View Faculty

                                                    </button>

                                                </td>


                                            </tr>

                                        );

                                    }
                                )}


                            {/* ======================================
                                EMPTY
                            ====================================== */}

                            {!loading &&
                                !error &&
                                records.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="empty-table"
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

        </section>

    );

}


export default AttendanceManagementPage;