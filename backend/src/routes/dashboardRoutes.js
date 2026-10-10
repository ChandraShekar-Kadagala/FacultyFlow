import {
    Router
} from "express";

import {
    getDashboardSummaryController
} from "../controllers/dashboardController.js";

import {
    authenticateToken
} from "../middleware/authMiddleware.js";

import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router =
    Router();


// ============================================================
// ADMIN DASHBOARD SUMMARY
// ============================================================

router.get(

    "/summary",

    authenticateToken,

    requireRole("admin"),

    getDashboardSummaryController

);


export default router;