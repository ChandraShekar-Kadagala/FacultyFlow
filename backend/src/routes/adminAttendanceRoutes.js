import {
    Router
} from "express";


import {
    getAdminAttendanceController,
    getAdminAttendanceByIdController,
    getFacultyAttendanceController,
    getAttendanceByDateController
} from "../controllers/adminAttendanceController.js";


import {
    authenticateToken
} from "../middleware/authMiddleware.js";


import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router =
    Router();


// ============================================================
// ADMIN ATTENDANCE ROUTES
// ============================================================


// ------------------------------------------------------------
// GET ALL ATTENDANCE
// ------------------------------------------------------------

router.get(
    "/",
    authenticateToken,
    requireRole("admin"),
    getAdminAttendanceController
);


// ------------------------------------------------------------
// GET FACULTY ATTENDANCE
// ------------------------------------------------------------

router.get(
    "/faculty/:facultyId",
    authenticateToken,
    requireRole("admin"),
    getFacultyAttendanceController
);


// ------------------------------------------------------------
// GET ATTENDANCE BY DATE
// ------------------------------------------------------------

router.get(
    "/date/:date",
    authenticateToken,
    requireRole("admin"),
    getAttendanceByDateController
);


// ------------------------------------------------------------
// GET SINGLE ATTENDANCE RECORD
// ------------------------------------------------------------

router.get(
    "/:attendanceId",
    authenticateToken,
    requireRole("admin"),
    getAdminAttendanceByIdController
);


export default router;