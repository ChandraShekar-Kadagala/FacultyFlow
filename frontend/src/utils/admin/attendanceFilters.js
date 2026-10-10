function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}


function matchesSearch(
    record,
    faculty,
    searchTerm
) {

    const search =
        normalize(searchTerm);

    if (!search) {
        return true;
    }

    const searchableValues = [
        record.facultyId,
        faculty?.id,
        faculty?.name,
        faculty?.department,
        faculty?.course,
        record.course,
        record.department
    ];

    return searchableValues.some(
        value =>
            normalize(value)
                .includes(search)
    );
}


function matchesDate(
    record,
    dateFilter
) {

    if (!dateFilter) {
        return true;
    }

    return record.date === dateFilter;
}


function matchesDateRange(
    record,
    startDate,
    endDate
) {

    if (
        !startDate &&
        !endDate
    ) {
        return true;
    }

    const recordDate =
        record.date;

    if (
        startDate &&
        recordDate < startDate
    ) {
        return false;
    }

    if (
        endDate &&
        recordDate > endDate
    ) {
        return false;
    }

    return true;
}


function matchesDepartment(
    record,
    faculty,
    departmentFilter
) {

    if (
        !departmentFilter ||
        departmentFilter === "ALL"
    ) {
        return true;
    }

    const department =
        faculty?.department ||
        record.department ||
        "";

    return (
        department ===
        departmentFilter
    );
}


function matchesCourse(
    record,
    faculty,
    courseFilter
) {

    if (
        !courseFilter ||
        courseFilter === "ALL"
    ) {
        return true;
    }

    const course =
        faculty?.course ||
        record.course ||
        "";

    return (
        course ===
        courseFilter
    );
}


function matchesStatus(
    record,
    statusFilter
) {

    if (
        !statusFilter ||
        statusFilter === "ALL"
    ) {
        return true;
    }

    return (
        record.status ===
        statusFilter
    );
}


function matchesVerification(
    record,
    verificationFilter
) {

    if (
        !verificationFilter ||
        verificationFilter === "ALL"
    ) {
        return true;
    }

    const verification =
        record.verificationStatus ||
        "Pending";

    return (
        verification ===
        verificationFilter
    );
}


export function filterAttendanceRecords({
    records = [],
    facultyMap = {},
    searchTerm = "",
    dateFilter = "",
    startDate = "",
    endDate = "",
    departmentFilter = "ALL",
    courseFilter = "ALL",
    statusFilter = "ALL",
    verificationFilter = "ALL"
}) {

    return records.filter(
        record => {

            const faculty =
                facultyMap[
                    record.facultyId
                ];

            return (
                matchesSearch(
                    record,
                    faculty,
                    searchTerm
                ) &&

                matchesDate(
                    record,
                    dateFilter
                ) &&

                matchesDateRange(
                    record,
                    startDate,
                    endDate
                ) &&

                matchesDepartment(
                    record,
                    faculty,
                    departmentFilter
                ) &&

                matchesCourse(
                    record,
                    faculty,
                    courseFilter
                ) &&

                matchesStatus(
                    record,
                    statusFilter
                ) &&

                matchesVerification(
                    record,
                    verificationFilter
                )
            );
        }
    );
}


export function getUniqueDepartments({
    records = [],
    facultyMap = {}
}) {

    const values =
        records.map(
            record => {

                const faculty =
                    facultyMap[
                        record.facultyId
                    ];

                return (
                    faculty?.department ||
                    record.department ||
                    ""
                );
            }
        );

    return [
        ...new Set(
            values.filter(Boolean)
        )
    ].sort();
}


export function getUniqueCourses({
    records = [],
    facultyMap = {}
}) {

    const values =
        records.map(
            record => {

                const faculty =
                    facultyMap[
                        record.facultyId
                    ];

                return (
                    faculty?.course ||
                    record.course ||
                    ""
                );
            }
        );

    return [
        ...new Set(
            values.filter(Boolean)
        )
    ].sort();
}


export function getUniqueStatuses(
    records = []
) {

    return [
        ...new Set(
            records
                .map(
                    record =>
                        record.status
                )
                .filter(Boolean)
        )
    ].sort();
}


export function getUniqueVerificationStatuses(
    records = []
) {

    const values =
        records.map(
            record =>
                record.verificationStatus ||
                "Pending"
        );

    return [
        ...new Set(values)
    ].sort();
}