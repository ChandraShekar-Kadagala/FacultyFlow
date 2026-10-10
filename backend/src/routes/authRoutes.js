import {
    Router
} from "express";


import {
    login
} from "../controllers/authController.js";


import {
    authenticateToken
} from "../middleware/authMiddleware.js";


import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router = Router();


router.post(
    "/login",
    login
);


router.get(
    "/me",
    authenticateToken,
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Authenticated user.",

            user:
                req.user
        });
    }
);


router.get(
    "/admin-test",
    authenticateToken,
    requireRole("admin"),
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Admin authorization successful.",

            user:
                req.user
        });
    }
);


export default router;