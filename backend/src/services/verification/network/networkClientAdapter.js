// ============================================================
// WEB NETWORK CLIENT ADAPTER
// ============================================================
//
// The backend cannot directly inspect the faculty's Wi-Fi
// SSID/BSSID through the browser.
//
// This adapter intentionally reports unavailable.
//
// A React Native/mobile adapter can later provide supported
// network signals through a controlled API contract.
//

export function getWebNetworkSignal() {

    return {

        observedSSID:
            null,

        observedBSSID:
            null,

        observedIP:
            null,

        capability:
            "UNAVAILABLE"

    };

}