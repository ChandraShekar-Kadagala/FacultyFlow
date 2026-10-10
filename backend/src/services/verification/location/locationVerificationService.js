import CampusLocation
    from "../../../models/CampusLocation.js";

import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";

import {
    calculateDistanceMeters,
    isWithinRadius
} from "./locationMatcher.js";


// ============================================================
// GET ACTIVE CAMPUS LOCATIONS
// ============================================================

async function getActiveCampusLocations() {

    return CampusLocation
        .find({
            active: true
        })
        .lean();

}


// ============================================================
// VALIDATE COORDINATES
// ============================================================

function areValidCoordinates(
    latitude,
    longitude
) {

    if (
        typeof latitude !==
        "number"
    ) {

        return false;

    }


    if (
        typeof longitude !==
        "number"
    ) {

        return false;

    }


    if (
        latitude < -90 ||
        latitude > 90
    ) {

        return false;

    }


    if (
        longitude < -180 ||
        longitude > 180
    ) {

        return false;

    }


    return true;

}


// ============================================================
// VERIFY LOCATION
// ============================================================

export async function verifyLocationSignal({

    latitude = null,

    longitude = null

} = {}) {


    // --------------------------------------------------------
    // Get active campus locations
    // --------------------------------------------------------

    const campusLocations =
        await getActiveCampusLocations();


    // --------------------------------------------------------
    // No configuration
    // --------------------------------------------------------

    if (
        campusLocations.length ===
        0
    ) {

        return {

            type: "LOCATION",

            result:
                VERIFICATION_RESULTS.PENDING,

            reason:
                "No active campus location configuration exists.",

            metadata: {

                configuration:
                    "NOT_CONFIGURED"

            }

        };

    }


    // --------------------------------------------------------
    // Validate client coordinates
    // --------------------------------------------------------

    if (
        !areValidCoordinates(
            latitude,
            longitude
        )
    ) {

        return {

            type: "LOCATION",

            result:
                VERIFICATION_RESULTS.UNAVAILABLE,

            reason:
                VERIFICATION_REASONS.LOCATION_SIGNAL_UNAVAILABLE,

            metadata: {

                configuration:
                    "AVAILABLE",

                clientSignal:
                    "NOT_AVAILABLE"

            }

        };

    }


    // --------------------------------------------------------
    // Compare against each active campus location
    // --------------------------------------------------------

    for (
        const campusLocation
        of campusLocations
    ) {

        const distanceMeters =
            calculateDistanceMeters(

                latitude,

                longitude,

                campusLocation.latitude,

                campusLocation.longitude

            );


        const insideRadius =
            isWithinRadius(

                distanceMeters,

                campusLocation.radiusMeters

            );


        // ----------------------------------------------------
        // MATCH
        // ----------------------------------------------------

        if (
            insideRadius
        ) {

            return {

                type: "LOCATION",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Faculty location is within the configured campus radius.",

                metadata: {

                    locationId:
                        campusLocation.locationId,

                    locationName:
                        campusLocation.name,

                    distanceMeters:
                        Number(
                            distanceMeters.toFixed(2)
                        ),

                    allowedRadiusMeters:
                        campusLocation.radiusMeters

                }

            };

        }

    }


    // --------------------------------------------------------
    // NO CAMPUS LOCATION MATCH
    // --------------------------------------------------------

    return {

        type: "LOCATION",

        result:
            VERIFICATION_RESULTS.FAILED,

        reason:
            "Faculty location is outside all configured campus locations.",

        metadata: {

            campusLocationsChecked:
                campusLocations.length

        }

    };

}