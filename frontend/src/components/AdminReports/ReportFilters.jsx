import {
    useMemo
} from "react";

function ReportFilters({
    filters,
    setFilters,
    departments,
    facultyOptions,
    statuses,
    onReset
}) {
    const reportType =
        filters.reportType;

    const handleChange =
        event => {
            const {
                name,
                value
            } = event.target;

            setFilters(
                current => ({
                    ...current,
                    [name]: value
                })
            );
        };

    const facultyOptionsMemo =
        useMemo(
            () =>
                facultyOptions ||
                [],
            [facultyOptions]
        );

    return (
        <section className="dashboard-card">

            <div className="card-header">

                <div>
                    <span className="card-label">
                        REPORT CONTROLS
                    </span>

                    <h2>
                        Report Filters
                    </h2>

                    <p>
                        Configure the
                        attendance report.
                    </p>
                </div>

            </div>

            <div className="report-filter-grid">

                <div className="form-group">

                    <label>
                        Report Type
                    </label>

                    <select
                        name="reportType"
                        value={
                            filters.reportType
                        }
                        onChange={
                            handleChange
                        }
                    >
                        <option value="CUSTOM">
                            Custom Range
                        </option>

                        <option value="DAILY">
                            Daily
                        </option>

                        <option value="WEEKLY">
                            Weekly
                        </option>

                        <option value="MONTHLY">
                            Monthly
                        </option>
                    </select>

                </div>

                <div className="form-group">

                    <label>
                        From Date
                    </label>

                    <input
                        type="date"
                        name="fromDate"
                        value={
                            filters.fromDate
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                <div className="form-group">

                    <label>
                        To Date
                    </label>

                    <input
                        type="date"
                        name="toDate"
                        value={
                            filters.toDate
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                <div className="form-group">

                    <label>
                        Department
                    </label>

                    <select
                        name="department"
                        value={
                            filters.department
                        }
                        onChange={
                            handleChange
                        }
                    >
                        <option value="ALL">
                            All Departments
                        </option>

                        {departments.map(
                            department => (
                                <option
                                    key={
                                        department
                                    }
                                    value={
                                        department
                                    }
                                >
                                    {department}
                                </option>
                            )
                        )}
                    </select>

                </div>

                <div className="form-group">

                    <label>
                        Faculty
                    </label>

                    <select
                        name="facultyId"
                        value={
                            filters.facultyId
                        }
                        onChange={
                            handleChange
                        }
                    >
                        <option value="ALL">
                            All Faculty
                        </option>

                        {facultyOptionsMemo.map(
                            faculty => (
                                <option
                                    key={
                                        faculty.id
                                    }
                                    value={
                                        faculty.id
                                    }
                                >
                                    {faculty.name}
                                </option>
                            )
                        )}
                    </select>

                </div>

                <div className="form-group">

                    <label>
                        Status
                    </label>

                    <select
                        name="status"
                        value={
                            filters.status
                        }
                        onChange={
                            handleChange
                        }
                    >
                        <option value="ALL">
                            All Statuses
                        </option>

                        {statuses.map(
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

                </div>

            </div>

            <div className="report-filter-actions">

                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onReset}
                >
                    Reset Filters
                </button>

            </div>

        </section>
    );
}

export default ReportFilters;