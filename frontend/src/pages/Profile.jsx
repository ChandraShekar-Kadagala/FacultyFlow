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
        const targetId = facultyId || user?.facultyId || user?.userId;

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

                setError(
                    requestError.message ||
                    "Failed to load faculty profile."
                );

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


    return (

        <section className="admin-dashboard">

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        FACULTY PROFILE
                    </span>

                    <h1>
                        {faculty.name}
                    </h1>

                    <p>
                        Faculty ID: {faculty.facultyId}
                    </p>

                </div>


                <span
                    className={
                        `status-badge ${
                            faculty.status === "active"
                                ? "present"
                                : "pending"
                        }`
                    }
                >
                    {faculty.status}
                </span>

            </div>


            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            PROFILE INFORMATION
                        </span>

                        <h2>
                            Faculty Details
                        </h2>

                    </div>

                </div>


                <div className="profile-details-grid">

                    <div className="profile-detail">

                        <span>
                            Faculty ID
                        </span>

                        <strong>
                            {faculty.facultyId}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            User ID
                        </span>

                        <strong>
                            {faculty.userId}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            Employee Code
                        </span>

                        <strong>
                            {faculty.employeeCode}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            Name
                        </span>

                        <strong>
                            {faculty.name}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            Department
                        </span>

                        <strong>
                            {faculty.department}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            Designation
                        </span>

                        <strong>
                            {faculty.designation}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            Status
                        </span>

                        <strong>
                            {faculty.status}
                        </strong>

                    </div>


                    <div className="profile-detail">

                        <span>
                            Created At
                        </span>

                        <strong>
                            {faculty.createdAt
                                ? new Date(
                                    faculty.createdAt
                                ).toLocaleString()
                                : "-"
                            }
                        </strong>

                    </div>

                </div>

            </section>

        </section>
    );
}


export default FacultyProfilePage;