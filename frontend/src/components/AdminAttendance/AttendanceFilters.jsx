function AttendanceFilters({
    filters,
    options,
    onChange,
    onReset
}) {

    function handleChange(
        event
    ) {

        const {
            name,
            value
        } = event.target;

        onChange(
            name,
            value
        );
    }


    return (

        <div className="attendance-filter-panel">

            {/* SEARCH */}

            <div className="attendance-filter-field search-field">

                <label htmlFor="attendance-search">
                    Search
                </label>

                <input
                    id="attendance-search"
                    type="search"
                    name="searchTerm"
                    value={
                        filters.searchTerm
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="Faculty name, ID, department or course..."
                />

            </div>


            {/* DATE */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-date">
                    Date
                </label>

                <input
                    id="attendance-date"
                    type="date"
                    name="dateFilter"
                    value={
                        filters.dateFilter
                    }
                    onChange={
                        handleChange
                    }
                />

            </div>


            {/* START DATE */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-start-date">
                    From
                </label>

                <input
                    id="attendance-start-date"
                    type="date"
                    name="startDate"
                    value={
                        filters.startDate
                    }
                    onChange={
                        handleChange
                    }
                />

            </div>


            {/* END DATE */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-end-date">
                    To
                </label>

                <input
                    id="attendance-end-date"
                    type="date"
                    name="endDate"
                    value={
                        filters.endDate
                    }
                    onChange={
                        handleChange
                    }
                />

            </div>


            {/* DEPARTMENT */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-department">
                    Department
                </label>

                <select
                    id="attendance-department"
                    name="departmentFilter"
                    value={
                        filters.departmentFilter
                    }
                    onChange={
                        handleChange
                    }
                >

                    <option value="ALL">
                        All Departments
                    </option>

                    {
                        options.departments.map(
                            department => (

                                <option
                                    key={department}
                                    value={department}
                                >
                                    {department}
                                </option>

                            )
                        )
                    }

                </select>

            </div>


            {/* COURSE */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-course">
                    Course
                </label>

                <select
                    id="attendance-course"
                    name="courseFilter"
                    value={
                        filters.courseFilter
                    }
                    onChange={
                        handleChange
                    }
                >

                    <option value="ALL">
                        All Courses
                    </option>

                    {
                        options.courses.map(
                            course => (

                                <option
                                    key={course}
                                    value={course}
                                >
                                    {course}
                                </option>

                            )
                        )
                    }

                </select>

            </div>


            {/* STATUS */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-status">
                    Status
                </label>

                <select
                    id="attendance-status"
                    name="statusFilter"
                    value={
                        filters.statusFilter
                    }
                    onChange={
                        handleChange
                    }
                >

                    <option value="ALL">
                        All Status
                    </option>

                    {
                        options.statuses.map(
                            status => (

                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>

                            )
                        )
                    }

                </select>

            </div>


            {/* VERIFICATION */}

            <div className="attendance-filter-field">

                <label htmlFor="attendance-verification">
                    Verification
                </label>

                <select
                    id="attendance-verification"
                    name="verificationFilter"
                    value={
                        filters.verificationFilter
                    }
                    onChange={
                        handleChange
                    }
                >

                    <option value="ALL">
                        All Verification
                    </option>

                    {
                        options
                            .verificationStatuses
                            .map(
                                verification => (

                                    <option
                                        key={
                                            verification
                                        }
                                        value={
                                            verification
                                        }
                                    >
                                        {
                                            verification
                                        }
                                    </option>

                                )
                            )
                    }

                </select>

            </div>


            {/* ACTIONS */}

            <div className="attendance-filter-actions">

                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onReset}
                >
                    Reset Filters
                </button>

            </div>

        </div>
    );
}


export default AttendanceFilters;