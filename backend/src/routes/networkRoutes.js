import express from "express";
import {
    getAllNetworksController,
    getActiveNetworksController,
    getNetworkByIdController,
    createNetworkController,
    updateNetworkController,
    toggleNetworkController,
    deleteNetworkController
} from "../controllers/networkController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole("admin"));

router.get("/active", getActiveNetworksController);
router.get("/", getAllNetworksController);
router.get("/:networkId", getNetworkByIdController);
router.post("/", createNetworkController);
router.put("/:networkId", updateNetworkController);
router.patch("/:networkId/toggle", toggleNetworkController);
router.delete("/:networkId", deleteNetworkController);

export default router;
