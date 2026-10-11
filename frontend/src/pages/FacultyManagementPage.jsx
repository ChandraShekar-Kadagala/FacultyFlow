import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
    getFacultyList
} from "../services/faculty/facultyService";

import {
    facultyMembers
} from "../data/mockData";


function FacultyManagementPage() {

    const navigate = useNavigate();
    const { accessToken } = useAuth();

    const [facultyData, setFacultyData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [
        searchTerm,
        setSearchTerm
    ] = useState("");

    const [
        departmentFilter,
        setDepartmentFilter
    ] = useState("ALL");

    const [
        statusFilter,
        setStatusFilter
    ] = useState("ALL");

    useEffect(() => {
        let mounted = true;

        async function fetchFaculty() {
            setLoading(true);
            try {
                if (accessToken) {
                    const response = await getFacultyList(accessToken);
                    if (mounted && response?.faculty && response.faculty.length > 0) {
                        setFacultyData(response.faculty);
                        setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.warn("Failed to load faculty from API, falling back:", err);
            }

            if (mounted) {
                setFacultyData(facultyMembers);
                setLoading(false);
            }
        }

        fetchFaculty();

        return () => {
            mounted = false;
        };
    }, [accessToken]);

    const departments = useMemo(() => {
        return [
            ...new Set(
                facultyData.map(
                    faculty =>
                        faculty.department
                ).filter(Boolean)
            )
        ];
    }, [facultyData]);


    const filteredFaculty = useMemo(() => {

        const search =
            searchTerm
                .trim()
                .toLowerCase();


        return facultyData.filter(
            faculty => {
                const id = faculty.facultyId || faculty.id || "";
                const matchesSearch =
                    search === "" ||
                    (faculty.name || "")
                        .toLowerCase()
                        .includes(search) ||
                    id
                        .toLowerCase()
                        .includes(search) ||
                    (faculty.department || "")
                        .toLowerCase()
                        .includes(search);


                const matchesDepartment =
                    departmentFilter === "ALL" ||
                    faculty.department ===
                        departmentFilter;


                const matchesStatus =
                    statusFilter === "ALL" ||
                    (faculty.status || "")
                        .toLowerCase() ===
                        statusFilter.toLowerCase();


                return (
                    matchesSearch &&
                    matchesDepartment &&
                    matchesStatus
                );
            }
        );

    }, [
        facultyData,
        searchTerm,
        departmentFilter,
        statusFilter
    ]);


    return (

        <section className="admin-dashboard">

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        FACULTY MANAGEMENT
                    </span>

                    <h1>
                        Faculty Management
                    </h1>

                    <p>
                        View and manage registered
                        FacultyFlow faculty records.
                    </p>

                </div>

                <div>

                    <strong>
                        {filteredFaculty.length}
                    </strong>

                    <span>
                        {" "}of{" "}
                        {facultyMembers.length}
                        {" "}faculty
                    </span>

                </div>

            </div>


            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            FACULTY DIRECTORY
                        </span>

                        <h2>
                            Registered Faculty
                        </h2>

                        <p>
                            Search and filter faculty
                            records.
                        </p>

                    </div>

                </div>


                <div className="faculty-management-filters">

                    <input
                        type="search"
                        placeholder="Search by name, ID or department..."
                        value={searchTerm}
                        onChange={event =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                    />


                    <select
                        value={departmentFilter}
                        onChange={event =>
                            setDepartmentFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Departments
                        </option>

                        {departments.map(
                            department => (

                                <option
                                    key={department}
                                    value={department}
                                >
                                    {department}
                                </option>

                            )
                        )}

                    </select>


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

                        <option value="Active">
                            Active
                        </option>

                        <option value="Inactive">
                            Inactive
                        </option>

                    </select>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Employee Code
                                </th>

                                <th>
                                    Department
                                </th>

                                <th>
                                    Designation
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredFaculty.map(
                                faculty => {
                                    const fid = faculty.facultyId || faculty.id;
                                    return (
                                        <tr
                                            key={fid}
                                        >
                                            <td>
                                                <div className="faculty-info">
                                                    <div className="faculty-avatar">
                                                        {(faculty.name || "F").charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            {faculty.name}
                                                        </strong>
                                                        <span>
                                                            {fid}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {faculty.employeeCode || "-"}
                                            </td>

                                            <td>
                                                {faculty.department || "-"}
                                            </td>

                                            <td>
                                                {faculty.designation || "-"}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        `status-badge ${(faculty.status || "active").toLowerCase()}`
                                                    }
                                                >
                                                    {faculty.status || "Active"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() =>
                                                        navigate(
                                                            `/faculty/${fid}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }
                            )}


                            {filteredFaculty.length === 0 && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="empty-table"
                                    >
                                        No faculty records
                                        match your filters.
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


export default FacultyManagementPage;