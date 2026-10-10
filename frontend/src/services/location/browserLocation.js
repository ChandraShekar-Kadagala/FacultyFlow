function createLocationError(

    code,
    message

) {

    const error =
        new Error(message);

    error.code =
        code;

    return error;

}


export function isBrowserLocationSupported() {

    return (
        typeof navigator !== "undefined" &&
        "geolocation" in navigator
    );

}


export function getCurrentBrowserLocation() {

    return new Promise(

        (resolve, reject) => {

            if (
                !isBrowserLocationSupported()
            ) {

                reject(

                    createLocationError(

                        "LOCATION_UNSUPPORTED",

                        "This browser does not support location services."

                    )

                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    const {

                        latitude,
                        longitude,
                        accuracy

                    } =
                        position.coords;


                    if (

                        !Number.isFinite(
                            latitude
                        ) ||

                        !Number.isFinite(
                            longitude
                        )

                    ) {

                        reject(

                            createLocationError(

                                "LOCATION_INVALID",

                                "The device returned an invalid location."

                            )

                        );

                        return;

                    }


                    resolve({

                        latitude,

                        longitude,

                        accuracyMeters:
                            Number.isFinite(
                                accuracy
                            )
                                ? accuracy
                                : null

                    });

                },


                error => {

                    switch (
                        error.code
                    ) {

                        case 1:

                            reject(

                                createLocationError(

                                    "LOCATION_PERMISSION_DENIED",

                                    "Location permission was denied. Please allow location access and try again."

                                )

                            );

                            break;


                        case 2:

                            reject(

                                createLocationError(

                                    "LOCATION_UNAVAILABLE",

                                    "The device could not determine your location."

                                )

                            );

                            break;


                        case 3:

                            reject(

                                createLocationError(

                                    "LOCATION_TIMEOUT",

                                    "Location detection timed out. Please try again."

                                )

                            );

                            break;


                        default:

                            reject(

                                createLocationError(

                                    "LOCATION_ERROR",

                                    "Unable to determine device location."

                                )

                            );

                    }

                },


                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        0

                }

            );

        }

    );

}