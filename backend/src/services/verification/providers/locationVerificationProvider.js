import {

    verifyCampusLocation

} from "../../location/locationService.js";


export async function verifyLocation({

    locationSignal

}) {

    if (!locationSignal) {

        return {
            type: "LOCATION",
            result:
                "UNAVAILABLE",
            reason:
                "Device location signal is unavailable."
        };

    }


    const result = await verifyCampusLocation({
        latitude:
            locationSignal.latitude,
        longitude:
            locationSignal.longitude,
        accuracyMeters:
            locationSignal.accuracyMeters
    });

    return {
        type: "LOCATION",
        ...result
    };
}