import AttendanceRecord from "../../models/AttendanceRecord.js";

import Faculty from "../../models/Faculty.js";


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

    const records =
        await AttendanceRecord.find(
            filter
        )
            .sort({

                date: -1,

                checkInTime: -1

            })
            .lean();


    return {

        count:
            records.length,

        records

    };

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


    return AttendanceRecord.findOne({

        attendanceId

    }).lean();

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


    const records =
        await AttendanceRecord.find({

            date

        })
            .sort({

                checkInTime: -1

            })
            .lean();


    return {

        date,

        count:
            records.length,

        records

    };

}