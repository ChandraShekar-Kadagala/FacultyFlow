import AttendanceRecord from "../../models/AttendanceRecord.js";

import Faculty from "../../models/Faculty.js";

import { calculateWorkingDuration } from "../../utils/attendance/durationUtils.js";
import { reconcileOverdueSessions } from "./attendanceReconciliationService.js";


// ============================================================
// GET ALL ATTENDANCE
// ============================================================

export async function getAdminAttendance({

    facultyId,

    date,

    startDate,

    endDate,

    status,

    verificationStatus,

    search
} = {}) {
    // Reconcile open sessions from prior days/shifts so admin always sees up-to-date data
    await reconcileOverdueSessions().catch(err => {
        console.warn("Session reconciliation error during getAdminAttendance:", err.message);
    });

    const filter = {};


    // --------------------------------------------------------
    // Faculty filter
    // --------------------------------------------------------

    if (
        facultyId
    ) {

        filter.facultyId =
            facultyId;

    }


    // --------------------------------------------------------
    // Exact date filter
    // --------------------------------------------------------

    if (
        date
    ) {

        filter.date =
            date;

    }


    // --------------------------------------------------------
    // Date range filter
    // --------------------------------------------------------

    if (
        startDate ||
        endDate
    ) {

        filter.date = {};


        if (
            startDate
        ) {

            filter.date.$gte =
                startDate;

        }


        if (
            endDate
        ) {

            filter.date.$lte =
                endDate;

        }

    }


    // --------------------------------------------------------
    // Attendance status
    // --------------------------------------------------------

    if (
        status
    ) {

        filter.status =
            status;

    }


    // --------------------------------------------------------
    // Verification status
    // --------------------------------------------------------

    if (
        verificationStatus
    ) {

        filter.verificationStatus =
            verificationStatus;

    }


    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------
    //
    // Search is handled through faculty records because
    // AttendanceRecord stores facultyId.
    //
    // Supported:
    // - faculty name
    // - employee code
    // - faculty ID
    // - department
    //

    if (
        search
    ) {

        const searchRegex =
            new RegExp(
                search.trim(),
                "i"
            );


        const matchingFaculty =
            await Faculty.find({

                $or: [

                    {
                        facultyId:
                            searchRegex
                    },

                    {
                        name:
                            searchRegex
                    },

                    {
                        employeeCode:
                            searchRegex
                    },

                    {
                        department:
                            searchRegex
                    }

                ]

            })
                .select(
                    "facultyId"
                )
                .lean();


        const matchingFacultyIds =
            matchingFaculty.map(
                faculty =>
                    faculty.facultyId
            );


        // ----------------------------------------------------
        // No matching faculty
        // ----------------------------------------------------

        if (
            matchingFacultyIds.length === 0
        ) {

            return {

                count: 0,

                records: []

            };

        }


        // ----------------------------------------------------
        // Combine with existing faculty filter
        // ----------------------------------------------------

        if (
            facultyId
        ) {

            if (
                !matchingFacultyIds.includes(
                    facultyId
                )
            ) {

                return {

                    count: 0,

                    records: []

                };

            }

        } else {

            filter.facultyId = {

                $in:
                    matchingFacultyIds

            };

        }

    }


    // --------------------------------------------------------
    // Query attendance
    // --------------------------------------------------------

    const rawRecords =
        await AttendanceRecord.find(
            filter
        )
            .sort({

                date: -1,

                checkInTime: -1

            })
            .lean();

    const records =
        await populateFacultyForRecords(rawRecords);

    return {

        count:
            records.length,

        records

    };

}


async function populateFacultyForRecords(records) {
    if (!records || records.length === 0) {
        return [];
    }

    const facultyIds = [
        ...new Set(
            records.map(r => r.facultyId).filter(Boolean)
        )
    ];

    const facultyMap = new Map();
    if (facultyIds.length > 0) {
        const facultyList = await Faculty.find({
            $or: [
                { facultyId: { $in: facultyIds } },
                { userId: { $in: facultyIds } },
                { employeeCode: { $in: facultyIds } }
            ]
        }).lean();

        facultyList.forEach(f => {
            if (f.facultyId) facultyMap.set(f.facultyId, f);
            if (f.userId) facultyMap.set(f.userId, f);
            if (f.employeeCode) facultyMap.set(f.employeeCode, f);
        });
    }

    return records.map(record => {
        const duration = calculateWorkingDuration(record.checkInTime, record.checkOutTime);
        return {
            ...record,
            faculty: facultyMap.get(record.facultyId) || null,
            workingDurationMinutes: record.workingDurationMinutes ?? (record.checkOutTime ? duration.minutes : null),
            workingDurationFormatted: record.workingDurationFormatted || (record.checkOutTime ? duration.formatted : null),
            workingDurationCompact: duration.formattedCompact,
            isOngoing: duration.isOngoing,
            elapsedMinutes: duration.minutes,
            elapsedFormatted: duration.formatted
        };
    });
}


// ============================================================
// GET SINGLE ATTENDANCE
// ============================================================

export async function getAdminAttendanceById(
    attendanceId
) {

    if (
        !attendanceId
    ) {

        return null;

    }


    const record = await AttendanceRecord.findOne({

        attendanceId

    }).lean();

    if (!record) {
        return null;
    }

    const populated = await populateFacultyForRecords([record]);
    return populated[0];

}


// ============================================================
// GET ATTENDANCE FOR ONE FACULTY
// ============================================================

export async function getFacultyAttendance(
    facultyId
) {

    if (
        !facultyId
    ) {

        return null;

    }


    // --------------------------------------------------------
    // Find faculty
    // --------------------------------------------------------

    const faculty =
        await Faculty.findOne({

            facultyId

        }).lean();


    if (
        !faculty
    ) {

        return null;

    }


    // --------------------------------------------------------
    // Find attendance records
    // --------------------------------------------------------

    const records =
        await AttendanceRecord.find({

            facultyId

        })
            .sort({

                date: -1

            })
            .lean();


    return {

        faculty,

        count:
            records.length,

        records

    };

}


// ============================================================
// GET ATTENDANCE BY DATE
// ============================================================

export async function getAttendanceByDate(
    date
) {

    if (
        !date
    ) {

        return {

            date,

            count: 0,

            records: []

        };

    }


    const rawRecords =
        await AttendanceRecord.find({

            date

        })
            .sort({

                checkInTime: -1

            })
            .lean();

    const records =
        await populateFacultyForRecords(rawRecords);

    return {

        date,

        count:
            records.length,

        records

    };

}