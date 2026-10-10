function normalizeDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    return String(dateValue).slice(0, 10);
}


export function calculateAttendanceRate(
    presentCount,
    totalCount
) {
    if (
        !Number.isFinite(presentCount) ||
        !Number.isFinite(totalCount) ||
        totalCount <= 0
    ) {
        return 0;
    }

    return Number(
        (
            (presentCount / totalCount) *
            100
        ).toFixed(1)
    );
}


export function calculateReportSummary(
    records
) {
    const safeRecords =
        Array.isArray(records)
            ? records
            : [];

    const totalRecords =
        safeRecords.length;

    const presentCount =
        safeRecords.filter(
            record =>
                record?.status ===
                "Present"
        ).length;

    const lateCount =
        safeRecords.filter(
            record =>
                record?.status ===
                "Late"
        ).length;

    const absentCount =
        safeRecords.filter(
            record =>
                record?.status ===
                "Absent"
        ).length;

    const verifiedCount =
        safeRecords.filter(
            record =>
                record?.verificationStatus ===
                "Verified"
        ).length;

    const pendingVerificationCount =
        safeRecords.filter(
            record =>
                record?.verificationStatus !==
                "Verified"
        ).length;

    const attendanceRate =
        calculateAttendanceRate(
            presentCount + lateCount,
            totalRecords
        );

    const verificationRate =
        calculateAttendanceRate(
            verifiedCount,
            totalRecords
        );

    return {
        totalRecords,
        presentCount,
        lateCount,
        absentCount,
        verifiedCount,
        pendingVerificationCount,
        attendanceRate,
        verificationRate
    };
}


export function groupRecordsByDate(
    records
) {
    const safeRecords =
        Array.isArray(records)
            ? records
            : [];

    const groups = {};

    safeRecords.forEach(record => {
        const date =
            normalizeDate(
                record?.date
            );

        if (!date) {
            return;
        }

        if (!groups[date]) {
            groups[date] = [];
        }

        groups[date].push(record);
    });

    return groups;
}


export function groupRecordsByMonth(
    records
) {
    const safeRecords =
        Array.isArray(records)
            ? records
            : [];

    const groups = {};

    safeRecords.forEach(record => {
        const date =
            normalizeDate(
                record?.date
            );

        if (!date) {
            return;
        }

        const month =
            date.slice(0, 7);

        if (!groups[month]) {
            groups[month] = [];
        }

        groups[month].push(record);
    });

    return groups;
}


export function getReportPeriodLabel(
    reportType,
    fromDate,
    toDate
) {
    if (
        reportType === "DAILY" &&
        fromDate
    ) {
        return fromDate;
    }

    if (
        reportType === "WEEKLY" &&
        fromDate &&
        toDate
    ) {
        return `${fromDate} → ${toDate}`;
    }

    if (
        reportType === "MONTHLY" &&
        fromDate
    ) {
        return fromDate.slice(0, 7);
    }

    if (
        fromDate &&
        toDate
    ) {
        return `${fromDate} → ${toDate}`;
    }

    return "All available records";
}