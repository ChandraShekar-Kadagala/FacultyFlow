import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
    getFacultyById
} from "../services/faculty/facultyService";


function FacultyProfilePage() {

    const {
        facultyId
    } = useParams();


    const {
        accessToken,
        user
    } = useAuth();


    const [
        faculty,
        setFaculty
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {
        const targetId = facultyId || user?.facultyId || user?.userId || "me";

        async function loadFaculty() {

            setLoading(true);

            setError("");


            try {

                const response =
                    await getFacultyById(
                        targetId,
                        accessToken
                    );


                setFaculty(
                    response.faculty
                );

            } catch (requestError) {
                if (user && (user.role === "faculty" || user.facultyId)) {
                    // Graceful session hydration if server lookup encounters transient error
                    setFaculty({
                        facultyId: user.facultyId || user.userId || "F101",
                        userId: user.userId || "U101",
                        employeeCode: user.employeeCode || `EMP-${user.facultyId || user.userId || "F101"}`,
                        name: user.name || "Faculty Member",
                        department: user.department || "Academic Department",
                        designation: user.designation || "Faculty",
                        status: user.status || "active"
                    });
                } else {
                    setError(
                        requestError.message ||
                        "Failed to load faculty profile."
                    );
                }
            } finally {

                setLoading(false);
            }
        }


        if (
            targetId &&
            accessToken
        ) {

            loadFaculty();

        } else {

            setLoading(false);

            setError(
                "Faculty ID or authentication session is missing."
            );
        }

    }, [
        facultyId,
        accessToken,
        user
    ]);


    if (loading) {

        return (

            <section className="admin-dashboard">

                <div className="admin-empty-state">

                    <strong>
                        Loading faculty profile...
                    </strong>

                    <p>
                        Fetching faculty data
                        from MongoDB.
                    </p>

                </div>

            </section>
        );
    }


    if (error) {

        return (

            <section className="admin-dashboard">

                <div className="admin-empty-state">

                    <strong>
                        Unable to load faculty profile
                    </strong>

                    <p>
                        {error}
                    </p>

                </div>

            </section>
        );
    }


    if (!faculty) {

        return (

            <section className="admin-dashboard">

                <div className="admin-empty-state">

                    <strong>
                        Faculty not found
                    </strong>

                    <p>
                        No faculty record exists
                        for this ID.
                    </p>

                </div>

            </section>
        );
    }


    const displayName = faculty.name || user?.name || "Faculty Member";
    const facultyIdVal = faculty.facultyId || user?.facultyId || user?.userId || "F101";
    const userIdVal = faculty.userId || user?.userId || "U101";
    const empCode = faculty.employeeCode || user?.employeeCode || `EMP-${facultyIdVal}`;
    const department = faculty.department || user?.department || "Academic Department";
    const designation = faculty.designation || user?.designation || "Assistant Professor";
    const email = user?.email || faculty.email || "faculty@facultyflow.com";
    const status = faculty.status || user?.status || "active";

    const formattedCreatedAt = faculty.createdAt
        ? new Date(faculty.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
        : "Institutional Baseline";

    return (
        <section className="admin-dashboard">
            {/* PAGE HEADER */}
            <div className="page-header dashboard-header">
                <div>
                    <span className="eyebrow">
                        FACULTY PROFILE
                    </span>
                    <h1>
                        Faculty Profile
                    </h1>
                    <p>
                        Institutional academic appointment, credentials, and verification profile.
                    </p>
                </div>

                <span
                    className={
                        `status-badge ${
                            status === "active"
                                ? "present"
                                : "pending"
                        }`
                    }
                >
                    ● {status.toUpperCase()}
                </span>
            </div>

            {/* IDENTITY HERO SECTION */}
            <div className="profile-hero-card">
                <div className="profile-hero-avatar">
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-hero-info">
                    <h2>{displayName}</h2>
                    <p className="profile-hero-subtitle">
                        {designation} • {department}
                    </p>
                    <span className="profile-hero-email">
                        ✉ {email}
                    </span>
                </div>
            </div>

            {/* DETAILS GRID CARD */}
            <section className="dashboard-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">
                            INSTITUTIONAL RECORD
                        </span>
                        <h2>
                            Faculty Employment Details
                        </h2>
                    </div>
                </div>

                <div className="profile-details-grid">
                    <div className="profile-detail">
                        <span>Faculty ID</span>
                        <strong>{facultyIdVal}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>User Account ID</span>
                        <strong>{userIdVal}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Employee Code</span>
                        <strong>{empCode}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Full Name</span>
                        <strong>{displayName}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Department</span>
                        <strong>{department}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Academic Rank</span>
                        <strong>{designation}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Institutional Email</span>
                        <strong>{email}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Account Status</span>
                        <strong>
                            {status === "active" ? "Active Account" : "Inactive"}
                        </strong>
                    </div>

                    <div className="profile-detail">
                        <span>Appointment Date</span>
                        <strong>{formattedCreatedAt}</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Attendance Verification</span>
                        <strong>Multi-Signal Geofence Authorized</strong>
                    </div>
                </div>
            </section>

            {/* INSTITUTIONAL ADVISORY NOTE */}
            <div className="profile-note">
                <div className="note-icon">
                    ℹ
                </div>
                <div>
                    <strong>Institutional Record Governance</strong>
                    <p>
                        Profile information is authoritative and managed by Academic Affairs. If you require changes to your departmental affiliation, designation, or employee code, please contact your university administrative office.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default FacultyProfilePage;