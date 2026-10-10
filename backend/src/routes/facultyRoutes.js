import {
    Router
} from "express";


import {
    getFacultyList,
    getFaculty,
    addFaculty,
    editFaculty,
    deactivateFacultyMember
} from "../controllers/facultyController.js";


import {
    authenticateToken
} from "../middleware/authMiddleware.js";


import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router = Router();


// Get all faculty
// Admin only

router.get(
    "/",
    authenticateToken,
    requireRole("admin"),
    getFacultyList
);


// Get one faculty
// Admin only

router.get(
    "/:facultyId",
    authenticateToken,
    requireRole("admin"),
    getFaculty
);


// Create faculty
// Admin only

router.post(
    "/",
    authenticateToken,
    requireRole("admin"),
    addFaculty
);


// Update faculty
// Admin only

router.patch(
    "/:facultyId",
    authenticateToken,
    requireRole("admin"),
    editFaculty
);


// Deactivate faculty
// Admin only

router.patch(
    "/:facultyId/deactivate",
    authenticateToken,
    requireRole("admin"),
    deactivateFacultyMember
);


export default router;