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
// Admin can view any faculty; Faculty can view their own profile
router.get(
    "/:facultyId",
    authenticateToken,
    (req, res, next) => {
        if (req.user?.role === "admin" || req.user?.facultyId === req.params.facultyId) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: "You do not have permission to access this resource."
        });
    },
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