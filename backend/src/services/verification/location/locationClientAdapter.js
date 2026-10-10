// ============================================================
// WEB LOCATION CLIENT ADAPTER
// ============================================================
//
// The backend itself cannot call the faculty browser's
// navigator.geolocation API.
//
// The frontend/mobile client must collect the location signal
// and provide it through the verification contract.
//
// This adapter defines the expected shape for that signal.
//
// No location is fabricated here.
//

export function getWebLocationSignal(
    locationSignal = null
) {

    if (
        !locationSignal
    ) {

        return {

            latitude:
                null,

            longitude:
                null,

            accuracyMeters:
                null,

            capability:
                "UNAVAILABLE"

        };

    }


    return {

        latitude:
            locationSignal.latitude ??
            null,

        longitude:
            locationSignal.longitude ??
            null,

        accuracyMeters:
            locationSignal.accuracyMeters ??
            null,

        capability:
            "AVAILABLE"

    };

}