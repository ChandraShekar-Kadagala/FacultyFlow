import CampusLocation
    from "../../models/CampusLocation.js";


import {

    calculateDistanceMeters,
    isWithinRadius

} from "./locationMatcher.js";


function generateLocationId() {

    return (

        `LOC-${Date.now()}-${

            Math.random()
                .toString(36)
                .slice(2, 8)
                .toUpperCase()

        }`

    );

}


// ============================================================
// GET ACTIVE LOCATION
// ============================================================

export async function getActiveCampusLocation() {

    const locations =
        await CampusLocation.find({

            active: true

        })

        .sort({

            createdAt: -1

        });


    if (
        locations.length === 0
    ) {

        const error =
            new Error(

                "No active campus location is configured."

            );

        error.statusCode =
            503;

        error.code =
            "CAMPUS_LOCATION_UNAVAILABLE";

        throw error;

    }


    if (
        locations.length > 1
    ) {

        const error =
            new Error(

                "Multiple active campus locations are configured."

            );

        error.statusCode =
            500;

        error.code =
            "MULTIPLE_ACTIVE_CAMPUS_LOCATIONS";

        throw error;

    }


    return locations[0];

}


// ============================================================
// GET ALL
// ============================================================

export async function getAllCampusLocations() {

    return await CampusLocation.find()

        .sort({

            createdAt: -1

        });

}


// ============================================================
// GET BY ID
// ============================================================

export async function getCampusLocationById(
    locationId
) {

    const location =
        await CampusLocation.findOne({

            locationId

        });


    if (!location) {

        const error =
            new Error(

                "Campus location was not found."

            );

        error.statusCode =
            404;

        error.code =
            "CAMPUS_LOCATION_NOT_FOUND";

        throw error;

    }


    return location;

}


// ============================================================
// CREATE
// ============================================================

export async function createCampusLocation(
    input
) {

    const location =
        await CampusLocation.create({

            locationId:
                generateLocationId(),

            name:
                input.name,

            latitude:
                input.latitude,

            longitude:
                input.longitude,

            radiusMeters:
                input.radiusMeters,

            active:
                input.active ?? true

        });


    return location;

}


// ============================================================
// UPDATE
// ============================================================

export async function updateCampusLocation(

    locationId,

    input

) {

    const location =
        await getCampusLocationById(

            locationId

        );


    if (
        input.name !== undefined
    ) {

        location.name =
            input.name;

    }


    if (
        input.latitude !== undefined
    ) {

        location.latitude =
            input.latitude;

    }


    if (
        input.longitude !== undefined
    ) {

        location.longitude =
            input.longitude;

    }


    if (
        input.radiusMeters !== undefined
    ) {

        location.radiusMeters =
            input.radiusMeters;

    }


    if (
        input.active !== undefined
    ) {

        location.active =
            input.active;

    }


    await location.save();


    return location;

}


// ============================================================
// ACTIVATE
// ============================================================

export async function activateCampusLocation(
    locationId
) {

    const location =
        await getCampusLocationById(

            locationId

        );


    // Only one active campus location.
    await CampusLocation.updateMany(

        {

            active: true,

            locationId: {
                $ne: locationId
            }

        },

        {

            $set: {
                active: false
            }

        }

    );


    location.active =
        true;


    await location.save();


    return location;

}


// ============================================================
// DEACTIVATE
// ============================================================

export async function deactivateCampusLocation(
    locationId
) {

    const location =
        await getCampusLocationById(

            locationId

        );


    location.active =
        false;


    await location.save();


    return location;

}


// ============================================================
// VERIFY LOCATION
// ============================================================

export async function verifyCampusLocation({

    latitude,
    longitude,
    accuracyMeters = null

}) {

    const location =
        await getActiveCampusLocation();


    if (

        typeof latitude !== "number" ||

        typeof longitude !== "number"

    ) {

        return {

            result:
                "UNAVAILABLE",

            reason:
                "A valid device location signal is unavailable."

        };

    }


    if (

        latitude < -90 ||

        latitude > 90 ||

        longitude < -180 ||

        longitude > 180

    ) {

        return {

            result:
                "FAILED",

            reason:
                "The supplied location coordinates are invalid."

        };

    }


    const distanceMeters =
        calculateDistanceMeters({

            latitude1:
                location.latitude,

            longitude1:
                location.longitude,

            latitude2:
                latitude,

            longitude2:
                longitude

        });


    const verified =
        isWithinRadius({

            distanceMeters,

            radiusMeters:
                location.radiusMeters

        });


    if (!verified) {

        return {

            result:
                "FAILED",

            reason:
                "Faculty device is outside the configured campus area.",

            locationId:
                location.locationId,

            distanceMeters,

            radiusMeters:
                location.radiusMeters,

            accuracyMeters

        };

    }


    return {

        result:
            "VERIFIED",

        reason:
            "Faculty device is within the configured campus area.",

        locationId:
            location.locationId,

        distanceMeters,

        radiusMeters:
            location.radiusMeters,

        accuracyMeters

    };

}


// ============================================================
// DELETE
// ============================================================

export async function deleteCampusLocation(locationId) {
    const location = await CampusLocation.findOneAndDelete({
        locationId
    });

    if (!location) {
        const error = new Error("Campus location was not found.");
        error.statusCode = 404;
        error.code = "CAMPUS_LOCATION_NOT_FOUND";
        throw error;
    }

    return location;
}