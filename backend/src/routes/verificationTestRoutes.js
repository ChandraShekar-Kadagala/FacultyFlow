import express from "express";

import {
    authenticateToken
} from "../middleware/authMiddleware.js";

import {
    requireRole
} from "../middleware/roleMiddleware.js";

import {
    testVerificationEngineController
} from "../controllers/verificationTestController.js";


const router =
    express.Router();


// ============================================================
// CONTROLLED VERIFICATION ENGINE TEST
// ============================================================

router.post(

    "/test",

    authenticateToken,

    requireRole("faculty"),

    testVerificationEngineController

);


export default router;