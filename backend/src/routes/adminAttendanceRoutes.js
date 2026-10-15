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
// MANUAL SESSION RECONCILIATION
// ------------------------------------------------------------

router.post(
    "/reconcile",
    authenticateToken,
    requireRole("admin"),
    async (req, res, next) => {
        try {
            const { reconcileOverdueSessions } = await import("../services/attendance/attendanceReconciliationService.js");
            const result = await reconcileOverdueSessions();
            return res.status(200).json({
                success: true,
                message: `Reconciliation completed: ${result.reconciledCount} overdue open sessions auto-closed.`,
                reconciledCount: result.reconciledCount,
                records: result.records
            });
        } catch (error) {
            next(error);
        }
    }
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