import * as Location
    from "expo-location";


export async function getCurrentLocation() {

    const permission =
        await Location.requestForegroundPermissionsAsync();


    if (
        permission.status !==
        Location.PermissionStatus.GRANTED
    ) {

        const error =
            new Error(
                "Location permission is required for attendance."
            );

        error.code =
            "LOCATION_PERMISSION_DENIED";

        throw error;

    }


    const position =
        await Location.getCurrentPositionAsync({

            accuracy:
                Location.Accuracy.High

        });


    return {

        latitude:
            position.coords.latitude,

        longitude:
            position.coords.longitude,

        accuracyMeters:
            position.coords.accuracy ?? null

    };

}