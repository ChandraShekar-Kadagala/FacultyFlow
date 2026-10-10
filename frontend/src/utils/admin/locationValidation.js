export function validateCampusLocation(location) {

    const errors = {};

    const name =
        String(location.name || "").trim();

    const latitude =
        Number(location.latitude);

    const longitude =
        Number(location.longitude);

    const radius =
        Number(location.radiusMeters);


    if (!name) {
        errors.name =
            "Campus name is required.";
    }


    if (
        location.latitude === "" ||
        location.latitude === null ||
        location.latitude === undefined
    ) {
        errors.latitude =
            "Latitude is required.";
    } else if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
    ) {
        errors.latitude =
            "Latitude must be between -90 and 90.";
    }


    if (
        location.longitude === "" ||
        location.longitude === null ||
        location.longitude === undefined
    ) {
        errors.longitude =
            "Longitude is required.";
    } else if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        errors.longitude =
            "Longitude must be between -180 and 180.";
    }


    if (
        location.radiusMeters === "" ||
        location.radiusMeters === null ||
        location.radiusMeters === undefined
    ) {
        errors.radiusMeters =
            "Radius is required.";
    } else if (
        !Number.isFinite(radius) ||
        radius < 10 ||
        radius > 10000
    ) {
        errors.radiusMeters =
            "Radius must be between 10 and 10,000 meters.";
    }


    return {
        isValid:
            Object.keys(errors).length === 0,

        errors
    };
}