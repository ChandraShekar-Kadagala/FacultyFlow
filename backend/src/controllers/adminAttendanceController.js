import {
    getAdminAttendance,
    getAdminAttendanceById,
    getFacultyAttendance,
    getAttendanceByDate
} from "../services/attendance/adminAttendanceService.js";


// ============================================================
// GET ALL ATTENDANCE
// ============================================================

export async function getAdminAttendanceController(
    req,
    res,
    next
) {

    try {

        const result =
            await getAdminAttendance({
                facultyId:
                    req.query.facultyId,

                date:
                    req.query.date,

                startDate:
                    req.query.startDate,

                endDate:
                    req.query.endDate,

                status:
                    req.query.status,

                verificationStatus:
                    req.query.verificationStatus,

                search:
                    req.query.search

            });


        return res.status(200).json({

            success: true,

            count:
                result.count,

            records:
                result.records

        });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET SINGLE ATTENDANCE
// ============================================================

export async function getAdminAttendanceByIdController(
    req,
    res,
    next
) {

    try {

        const record =
            await getAdminAttendanceById(
                req.params.attendanceId
            );


        if (!record) {

            return res.status(404).json({

                success: false,

                message:
                    "Attendance record not found."

            });

        }


        return res.status(200).json({

            success: true,

            attendance:
                record

        });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET FACULTY ATTENDANCE
// ============================================================

export async function getFacultyAttendanceController(
    req,
    res,
    next
) {

    try {

        const result =
            await getFacultyAttendance(
                req.params.facultyId
            );


        if (!result) {

            return res.status(404).json({

                success: false,

                message:
                    "Faculty member not found."

            });

        }


        return res.status(200).json({

            success: true,

            faculty:
                result.faculty,

            count:
                result.count,

            records:
                result.records

        });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET ATTENDANCE BY DATE
// ============================================================

export async function getAttendanceByDateController(
    req,
    res,
    next
) {

    try {

        const result =
            await getAttendanceByDate(
                req.params.date
            );


        return res.status(200).json({

            success: true,

            date:
                result.date,

            count:
                result.count,

            records:
                result.records

        });

    } catch (error) {

        next(error);

    }

}