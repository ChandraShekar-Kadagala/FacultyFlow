import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
    getFacultyById
} from "../services/faculty/facultyService";

import {
    facultyMembers
} from "../data/mockData";

function FacultyDetailsPage() {
    const {
        facultyId
    } = useParams();

    const navigate = useNavigate();
    const { accessToken } = useAuth();

    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadFacultyDetails() {
            setLoading(true);
            setError("");

            try {
                if (accessToken && facultyId) {
                    const response = await getFacultyById(facultyId, accessToken);
                    if (mounted && response?.faculty) {
                        setFaculty(response.faculty);
                        setLoading(false);
                        return;
                    }
                }
            } catch (apiError) {
                console.warn("API lookup failed, checking fallback:", apiError);
            }

            // Fallback to static records if API has no match or during offline tests
            const fallback = facultyMembers.find(
                member =>
                    member.id === facultyId ||
                    member.facultyId === facultyId ||
                    member.userId === facultyId
            );

            if (mounted) {
                if (fallback) {
                    setFaculty(fallback);
                } else {
                    setError("Faculty record not found.");
                }
                setLoading(false);
            }
        }

        if (facultyId) {
            loadFacultyDetails();
        } else {
            setLoading(false);
            setError("No faculty ID was provided.");
        }

        return () => {
            mounted = false;
        };
    }, [facultyId, accessToken]);

    if (loading) {
        return (
            <section className="page-card">
                <div className="empty-state">
                    <h2>Loading Faculty Profile...</h2>
                    <p>Fetching faculty information.</p>
                </div>
            </section>
        );
    }

    if (error || !faculty) {
        return (
            <section className="page-card">
                <div className="empty-state">
                    <div className="empty-icon">!</div>
                    <h2>Faculty Not Found</h2>
                    <p>
                        No faculty exists with ID{" "}
                        <strong>{facultyId || "Unknown"}</strong>.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                </div>
            </section>
        );
    }

    const fid = faculty.facultyId || faculty.id || facultyId;
    const empCode = faculty.employeeCode || "-";
    const status = faculty.status || "active";

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
                    <span className="eyebrow">FACULTY PROFILE</span>
                    <h1>{faculty.name}</h1>
                    <p>Faculty account and employment information.</p>
                </div>

                <span className={`profile-status ${status === "active" ? "status-badge present" : "status-badge pending"}`}>
                    ● {status}
                </span>
            </div>

            <div className="details-hero">
                <div className="profile-avatar large">
                    {faculty.name?.charAt(0) || "F"}
                </div>

                <div>
                    <h2>{faculty.name}</h2>
                    <p>
                        {faculty.designation || "Faculty Member"}
                        {" • "}
                        {faculty.department || "Department"}
                    </p>
                </div>
            </div>

            <div className="details-grid">
                <div className="detail-item">
                    <span>Faculty ID</span>
                    <strong>{fid}</strong>
                </div>

                <div className="detail-item">
                    <span>Employee Code</span>
                    <strong>{empCode}</strong>
                </div>

                <div className="detail-item">
                    <span>Department</span>
                    <strong>{faculty.department || "-"}</strong>
                </div>

                <div className="detail-item">
                    <span>Designation</span>
                    <strong>{faculty.designation || "-"}</strong>
                </div>

                <div className="detail-item">
                    <span>Email</span>
                    <strong>{faculty.email || "Not available"}</strong>
                </div>

                <div className="detail-item">
                    <span>Account Status</span>
                    <strong className={status === "active" ? "text-success" : "text-muted"}>
                        {status}
                    </strong>
                </div>
            </div>
        </section>
    );
}

export default FacultyDetailsPage;