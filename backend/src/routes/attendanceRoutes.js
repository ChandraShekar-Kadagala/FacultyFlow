import { Router } from "express";

import {
    getTodayAttendanceController,
    getAttendanceHistoryController,
    checkInController,
    checkOutController
} from "../controllers/attendanceController.js";

import {
    authenticateToken
} from "../middleware/authMiddleware.js";

import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router = Router();


// ============================================================
// FACULTY TODAY ATTENDANCE
// ============================================================

router.get(
    "/today",
    authenticateToken,
    requireRole("faculty"),
    getTodayAttendanceController
);


// ============================================================
// FACULTY CHECK-IN
// ============================================================

router.post(
    "/check-in",
    authenticateToken,
    requireRole("faculty"),
    checkInController
);


// ============================================================
// FACULTY CHECK-OUT
// ============================================================

router.post(
    "/check-out",
    authenticateToken,
    requireRole("faculty"),
    checkOutController
);


// ============================================================
// FACULTY ATTENDANCE HISTORY
// ============================================================

router.get(
    "/history",
    authenticateToken,
    requireRole("faculty"),
    getAttendanceHistoryController
);


export default router;