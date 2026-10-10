import {
    attendanceHistory,
    facultyMembers
} from "../../data/mockData";

function normalizeDate(value) {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
}

function getFacultyMap() {
    return facultyMembers.reduce(
        (map, faculty) => {
            map[faculty.id] = faculty;
            return map;
        },
        {}
    );
}

export function getAttendanceReport(
    filters = {}
) {
    const {
        reportType = "CUSTOM",
        fromDate = "",
        toDate = "",
        facultyId = "ALL",
        department = "ALL",
        status = "ALL"
    } = filters;

    const facultyMap =
        getFacultyMap();

    let records = Array.isArray(
        attendanceHistory
    )
        ? [...attendanceHistory]
        : [];

    records = records.filter(record => {
        const recordDate =
            normalizeDate(record.date);

        const faculty =
            facultyMap[record.facultyId];

        const recordDepartment =
            faculty?.department ||
            record.department ||
            "";

        const matchesFaculty =
            facultyId === "ALL" ||
            record.facultyId ===
                facultyId;

        const matchesDepartment =
            department === "ALL" ||
            recordDepartment ===
                department;

        const matchesStatus =
            status === "ALL" ||
            record.status === status;

        const matchesFromDate =
            !fromDate ||
            recordDate >= fromDate;

        const matchesToDate =
            !toDate ||
            recordDate <= toDate;

        return (
            matchesFaculty &&
            matchesDepartment &&
            matchesStatus &&
            matchesFromDate &&
            matchesToDate
        );
    });

    if (reportType === "DAILY") {
        const targetDate =
            fromDate || toDate;

        if (targetDate) {
            records = records.filter(
                record =>
                    normalizeDate(
                        record.date
                    ) === targetDate
            );
        }
    }

    if (reportType === "MONTHLY") {
        const targetMonth =
            fromDate
                ? fromDate.slice(0, 7)
                : "";

        if (targetMonth) {
            records = records.filter(
                record =>
                    normalizeDate(
                        record.date
                    ).slice(0, 7) ===
                    targetMonth
            );
        }
    }

    return records.map(record => {
        const faculty =
            facultyMap[record.facultyId];

        return {
            ...record,

            facultyName:
                faculty?.name ||
                record.facultyName ||
                "Unknown Faculty",

            employeeCode:
                faculty?.employeeCode ||
                "",

            department:
                faculty?.department ||
                record.department ||
                "",

            designation:
                faculty?.designation ||
                "",

            verificationStatus:
                record.verificationStatus ||
                "Pending"
        };
    });
}

export function getDepartments() {
    return [
        ...new Set(
            facultyMembers
                .map(
                    faculty =>
                        faculty.department
                )
                .filter(Boolean)
        )
    ].sort();
}

export function getFacultyOptions() {
    return facultyMembers
        .map(faculty => ({
            id: faculty.id,
            name: faculty.name,
            employeeCode:
                faculty.employeeCode || ""
        }))
        .sort((a, b) =>
            a.name.localeCompare(
                b.name
            )
        );
}

export function getAvailableStatuses() {
    return [
        ...new Set(
            attendanceHistory
                .map(
                    record =>
                        record.status
                )
                .filter(Boolean)
        )
    ].sort();
}