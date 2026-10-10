import express
    from "express";

import {
    getActivePolicyController,
    getAllPoliciesController,
    getPolicyByIdController,
    createPolicyController,
    updatePolicyController,
    activatePolicyController,
    deactivatePolicyController
} from "../controllers/policyController.js";

import {
    authenticateToken
} from "../middleware/authMiddleware.js";

import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router =
    express.Router();


// ============================================================
// ADMIN POLICY ACCESS
// ============================================================

router.use(
    authenticateToken
);

router.use(
    requireRole(
        "admin"
    )
);


// ============================================================
// ACTIVE POLICY
// ============================================================

router.get(
    "/active",
    getActivePolicyController
);


// ============================================================
// ALL POLICIES
// ============================================================

router.get(
    "/",
    getAllPoliciesController
);


// ============================================================
// POLICY BY ID
// ============================================================

router.get(
    "/:policyId",
    getPolicyByIdController
);


// ============================================================
// CREATE
// ============================================================

router.post(
    "/",
    createPolicyController
);


// ============================================================
// UPDATE
// ============================================================

router.put(
    "/:policyId",
    updatePolicyController
);


// ============================================================
// ACTIVATE
// ============================================================

router.patch(
    "/:policyId/activate",
    activatePolicyController
);


// ============================================================
// DEACTIVATE
// ============================================================

router.patch(
    "/:policyId/deactivate",
    deactivatePolicyController
);


export default router;