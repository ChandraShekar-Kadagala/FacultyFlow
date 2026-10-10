export function calculateTotalFaculty(
    facultyMembers = []
) {
    return facultyMembers.length;
}


export function calculatePresentToday(
    records = []
) {
    return records.filter(
        record =>
            record.status === "Present"
    ).length;
}


export function calculateLateToday(
    records = []
) {
    return records.filter(
        record =>
            record.status === "Late"
    ).length;
}


export function calculateAbsentToday(
    totalFaculty,
    presentToday,
    lateToday
) {
    const attended =
        presentToday + lateToday;

    return Math.max(
        totalFaculty - attended,
        0
    );
}


export function calculateVerifiedToday(
    records = []
) {
    return records.filter(
        record =>
            record.verificationStatus ===
            "Verified"
    ).length;
}


export function calculatePendingVerification(
    records = []
) {
    return records.filter(
        record =>
            record.verificationStatus !==
            "Verified"
    ).length;
}


export function calculateAttendanceRate(
    totalFaculty,
    presentToday,
    lateToday
) {
    if (totalFaculty === 0) {
        return 0;
    }

    const attended =
        presentToday + lateToday;

    return Number(
        (
            (attended / totalFaculty) *
            100
        ).toFixed(1)
    );
}


export function calculateVerificationRate(
    records = []
) {
    if (records.length === 0) {
        return 0;
    }

    const verified =
        records.filter(
            record =>
                record.verificationStatus ===
                "Verified"
        ).length;

    return Number(
        (
            (verified / records.length) *
            100
        ).toFixed(1)
    );
}


export function calculateAdminKPIs({
    facultyMembers = [],
    attendanceRecords = []
}) {
    const totalFaculty =
        calculateTotalFaculty(
            facultyMembers
        );

    const presentToday =
        calculatePresentToday(
            attendanceRecords
        );

    const lateToday =
        calculateLateToday(
            attendanceRecords
        );

    const absentToday =
        calculateAbsentToday(
            totalFaculty,
            presentToday,
            lateToday
        );

    const verifiedToday =
        calculateVerifiedToday(
            attendanceRecords
        );

    const pendingVerification =
        calculatePendingVerification(
            attendanceRecords
        );

    const attendanceRate =
        calculateAttendanceRate(
            totalFaculty,
            presentToday,
            lateToday
        );

    const verificationRate =
        calculateVerificationRate(
            attendanceRecords
        );

    return {
        totalFaculty,
        presentToday,
        lateToday,
        absentToday,
        verifiedToday,
        pendingVerification,
        attendanceRate,
        verificationRate
    };
}