import {

    getActiveCampusLocation,
    getAllCampusLocations,
    getCampusLocationById,
    createCampusLocation,
    updateCampusLocation,
    activateCampusLocation,
    deactivateCampusLocation

} from "../services/location/locationService.js";


// ============================================================
// GET ACTIVE
// ============================================================

export async function getActiveLocationController(

    req,
    res,
    next

) {

    try {

        const location =
            await getActiveCampusLocation();


        return res

            .status(200)

            .json({

                success:
                    true,

                location

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET ALL
// ============================================================

export async function getAllLocationsController(

    req,
    res,
    next

) {

    try {

        const locations =
            await getAllCampusLocations();


        return res

            .status(200)

            .json({

                success:
                    true,

                count:
                    locations.length,

                locations

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// GET BY ID
// ============================================================

export async function getLocationByIdController(

    req,
    res,
    next

) {

    try {

        const location =
            await getCampusLocationById(

                req.params.locationId

            );


        return res

            .status(200)

            .json({

                success:
                    true,

                location

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// CREATE
// ============================================================

export async function createLocationController(

    req,
    res,
    next

) {

    try {

        const location =
            await createCampusLocation(

                req.body

            );


        return res

            .status(201)

            .json({

                success:
                    true,

                code:
                    "CAMPUS_LOCATION_CREATED",

                message:
                    "Campus location created successfully.",

                location

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// UPDATE
// ============================================================

export async function updateLocationController(

    req,
    res,
    next

) {

    try {

        const location =
            await updateCampusLocation(

                req.params.locationId,

                req.body

            );


        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "CAMPUS_LOCATION_UPDATED",

                message:
                    "Campus location updated successfully.",

                location

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// ACTIVATE
// ============================================================

export async function activateLocationController(

    req,
    res,
    next

) {

    try {

        const location =
            await activateCampusLocation(

                req.params.locationId

            );


        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "CAMPUS_LOCATION_ACTIVATED",

                message:
                    "Campus location activated successfully.",

                location

            });

    } catch (error) {

        next(error);

    }

}


// ============================================================
// DEACTIVATE
// ============================================================

export async function deactivateLocationController(

    req,
    res,
    next

) {

    try {

        const location =
            await deactivateCampusLocation(

                req.params.locationId

            );


        return res

            .status(200)

            .json({

                success:
                    true,

                code:
                    "CAMPUS_LOCATION_DEACTIVATED",

                message:
                    "Campus location deactivated successfully.",

                location

            });

    } catch (error) {

        next(error);

    }

}