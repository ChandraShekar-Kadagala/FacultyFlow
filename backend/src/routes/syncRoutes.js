
import express from "express";

import {
    syncEventController
} from "../controllers/syncController.js";

import {
    authenticateToken
} from "../middleware/authMiddleware.js";


const router = express.Router();

router.use(authenticateToken);

router.post(
    "/events",
    syncEventController
);

export default router;
