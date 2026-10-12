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


// Get currently authenticated faculty profile
router.get(
    "/profile",
    authenticateToken,
    async (req, res, next) => {
        try {
            const { getFacultyById } = await import("../services/faculty/facultyService.js");
            const targetId = req.user?.facultyId || req.user?.userId;
            const faculty = await getFacultyById(targetId);
            if (!faculty) {
                return res.status(404).json({
                    success: false,
                    message: "Faculty profile not found."
                });
            }
            res.status(200).json({
                success: true,
                faculty
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    "/me",
    authenticateToken,
    async (req, res, next) => {
        try {
            const { getFacultyById } = await import("../services/faculty/facultyService.js");
            const targetId = req.user?.facultyId || req.user?.userId;
            const faculty = await getFacultyById(targetId);
            if (!faculty) {
                return res.status(404).json({
                    success: false,
                    message: "Faculty profile not found."
                });
            }
            res.status(200).json({
                success: true,
                faculty
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get one faculty
// Admin can view any faculty; Faculty can view their own profile
router.get(
    "/:facultyId",
    authenticateToken,
    async (req, res, next) => {
        if (req.user?.role === "admin") {
            return next();
        }
        let requestedId = req.params.facultyId;
        if (requestedId === "me" || requestedId === "profile") {
            requestedId = req.user?.facultyId || req.user?.userId;
            req.params.facultyId = requestedId;
            return next();
        }
        if (
            req.user?.facultyId === requestedId ||
            req.user?.userId === requestedId
        ) {
            return next();
        }
        try {
            const { getFacultyById } = await import("../services/faculty/facultyService.js");
            const targetFaculty = await getFacultyById(requestedId);
            if (
                targetFaculty &&
                (targetFaculty.userId === req.user?.userId ||
                 targetFaculty.facultyId === req.user?.facultyId)
            ) {
                return next();
            }
        } catch (e) {
            // fall through to 403
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