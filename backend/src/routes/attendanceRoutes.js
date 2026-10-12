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


router.get(
    "/history",
    authenticateToken,
    requireRole("faculty"),
    getAttendanceHistoryController
);


// ============================================================
// FACULTY ACTIVE CONFIGURATION (POLICY, LOCATIONS, NETWORKS)
// ============================================================

router.get(
    "/policy",
    authenticateToken,
    async (req, res, next) => {
        try {
            const { getActiveAttendancePolicy } = await import("../services/attendance/policyService.js");
            const policy = await getActiveAttendancePolicy();
            return res.status(200).json({
                success: true,
                policy: {
                    startTime: policy.startTime,
                    endTime: policy.endTime,
                    gracePeriod: policy.gracePeriod,
                    lateThreshold: policy.lateThreshold,
                    requiredSignals: policy.requiredSignals,
                    active: policy.active
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    "/locations",
    authenticateToken,
    async (req, res, next) => {
        try {
            const { default: CampusLocation } = await import("../models/CampusLocation.js");
            const locations = await CampusLocation.find({ active: true }).lean();
            return res.status(200).json({
                success: true,
                locations: locations.map(l => ({
                    name: l.name,
                    latitude: l.latitude,
                    longitude: l.longitude,
                    radiusMeters: l.radiusMeters
                }))
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    "/networks",
    authenticateToken,
    async (req, res, next) => {
        try {
            const { getActiveNetworks } = await import("../services/network/networkService.js");
            const networks = await getActiveNetworks();
            return res.status(200).json({
                success: true,
                networks: networks.map(n => ({
                    name: n.name,
                    expectedSSID: n.expectedSSID,
                    building: n.building,
                    verificationMode: n.verificationMode,
                    allowedIPRanges: n.allowedIPRanges
                }))
            });
        } catch (error) {
            next(error);
        }
    }
);


export default router;