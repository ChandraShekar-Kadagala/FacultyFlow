import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    facultyMembers
} from "../data/mockData";

function FacultyDetailsPage() {
    const {
        facultyId
    } = useParams();

    const navigate = useNavigate();

    const faculty =
        facultyMembers.find(
            member =>
                member.id === facultyId
        );

    if (!faculty) {
        return (
            <section className="page-card">

                <div className="empty-state">
                    <div className="empty-icon">
                        !
                    </div>

                    <h2>
                        Faculty Not Found
                    </h2>

                    <p>
                        No faculty exists with ID{" "}
                        <strong>
                            {facultyId || "Unknown"}
                        </strong>.
                    </p>

                    <button
                        className="btn-primary"
                        onClick={() =>
                            navigate("/faculty")
                        }
                    >
                        Back to Dashboard
                    </button>
                </div>

            </section>
        );
    }

    return (
        <section className="page-card details-page">

            <button
                className="back-button"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <div className="page-header">

                <div>
                    <span className="eyebrow">
                        FACULTY PROFILE
                    </span>

                    <h1>
                        {faculty.name}
                    </h1>

                    <p>
                        Faculty account and employment
                        information.
                    </p>
                </div>

                <span className="profile-status">
                    ● {faculty.status}
                </span>

            </div>

            <div className="details-hero">

                <div className="profile-avatar large">
                    {faculty.name.charAt(0)}
                </div>

                <div>
                    <h2>
                        {faculty.name}
                    </h2>

                    <p>
                        {faculty.designation}
                        {" • "}
                        {faculty.department}
                    </p>
                </div>

            </div>

            <div className="details-grid">

                <div className="detail-item">
                    <span>
                        Faculty ID
                    </span>

                    <strong>
                        {faculty.id}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>
                        Email
                    </span>

                    <strong>
                        {faculty.email ||
                            "Not available"}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>
                        Department
                    </span>

                    <strong>
                        {faculty.department}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>
                        Designation
                    </span>

                    <strong>
                        {faculty.designation}
                    </strong>
                </div>

                <div className="detail-item">
                    <span>
                        Account Status
                    </span>

                    <strong className="text-success">
                        {faculty.status}
                    </strong>
                </div>

            </div>

        </section>
    );
}

export default FacultyDetailsPage;