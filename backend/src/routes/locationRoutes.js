import express
    from "express";


import {

    getActiveLocationController,
    getAllLocationsController,
    getLocationByIdController,
    createLocationController,
    updateLocationController,
    activateLocationController,
    deactivateLocationController

} from "../controllers/locationController.js";


import {
    authenticateToken
} from "../middleware/authMiddleware.js";


import {
    requireRole
} from "../middleware/roleMiddleware.js";


const router =
    express.Router();


router.use(
    authenticateToken
);


router.use(
    requireRole("admin")
);


// ============================================================
// READ
// ============================================================

router.get(

    "/active",

    getActiveLocationController

);


router.get(

    "/",

    getAllLocationsController

);


router.get(

    "/:locationId",

    getLocationByIdController

);


// ============================================================
// WRITE
// ============================================================

router.post(

    "/",

    createLocationController

);


router.put(

    "/:locationId",

    updateLocationController

);


router.patch(

    "/:locationId/activate",

    activateLocationController

);


router.patch(

    "/:locationId/deactivate",

    deactivateLocationController

);


export default router;