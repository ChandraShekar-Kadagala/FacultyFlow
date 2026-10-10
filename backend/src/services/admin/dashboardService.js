import Faculty
    from "../../models/Faculty.js";

import AttendanceRecord
    from "../../models/AttendanceRecord.js";


// ============================================================
// SERVER DATE
// ============================================================

function getServerDate() {

    const now = new Date();

    return now
        .toISOString()
        .slice(0, 10);

}


// ============================================================
// GET ADMIN DASHBOARD SUMMARY
// ============================================================

export async function getDashboardSummary() {

    const today =
        getServerDate();


    // ========================================================
    // ACTIVE FACULTY
    // ========================================================

    const totalFaculty =
        await Faculty.countDocuments({
            status: "active"
        });


    // ========================================================
    // TODAY'S ATTENDANCE RECORDS
    // ========================================================

    const todayRecords =
        await AttendanceRecord.find({
            date: today
        }).lean();


    // ========================================================
    // PRESENT
    // ========================================================

    const presentToday =
        todayRecords.filter(
            record =>
                record.status === "Present"
        ).length;


    // ========================================================
    // LATE
    // ========================================================

    const lateToday =
        todayRecords.filter(
            record =>
                record.status === "Late"
        ).length;


    // ========================================================
    // VERIFIED
    // ========================================================

    const verifiedToday =
        todayRecords.filter(
            record =>
                record.verificationStatus === "Verified"
        ).length;


    // ========================================================
    // PENDING VERIFICATION
    // ========================================================

    const pendingVerification =
        todayRecords.filter(
            record =>
                record.verificationStatus === "Pending"
        ).length;


    // ========================================================
    // FAILED VERIFICATION
    // ========================================================

    const failedVerification =
        todayRecords.filter(
            record =>
                record.verificationStatus === "Failed"
        ).length;


    // ========================================================
    // ATTENDANCE RATE
    // ========================================================
    // We calculate this only against faculty with an
    // attendance record today.
    //
    // Absent cannot be safely derived until expected
    // attendance policy/schedule is integrated.
    // ========================================================

    const attendanceRate =
        totalFaculty > 0
            ? Number(
                (
                    (
                        presentToday +
                        lateToday
                    ) /
                    totalFaculty
                ) * 100
            ).toFixed(2)
            : 0;


    // ========================================================
    // VERIFICATION RATE
    // ========================================================

    const verificationRate =
        todayRecords.length > 0
            ? Number(
                (
                    verifiedToday /
                    todayRecords.length
                ) * 100
            ).toFixed(2)
            : 0;


    // ========================================================
    // RETURN SUMMARY
    // ========================================================

    return {

        date: today,

        totalFaculty,

        attendance: {

            presentToday,

            lateToday,

            // Not derived yet because expected
            // attendance policy is not integrated.
            absentToday: null,

            incompleteToday:
                todayRecords.filter(
                    record =>
                        record.status ===
                        "Incomplete"
                ).length,

            verifiedToday,

            pendingVerification,

            failedVerification,

            attendanceRate,

            verificationRate

        }

    };

}