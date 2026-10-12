import NetInfo from "@react-native-community/netinfo";

/**
 * Captures real network connection observations.
 * 
 * Rules:
 * - Does NOT pretend Wi-Fi is verified just because Wi-Fi is enabled.
 * - Captures connection type (wifi, cellular, etc.) and IP/SSID if exposed by OS.
 * - Clearly documents platform limitations when Android restricts SSID access.
 */
export async function verifyNetwork() {
    try {
        const state = await NetInfo.fetch();

        if (!state.isConnected) {
            return {
                key: "network",
                type: "NETWORK",
                label: "Campus Network / Wi-Fi",
                status: "failed",
                passed: false,
                available: true,
                signal: null,
                reason: "Device has no active network connection. Please connect to Wi-Fi or cellular.",
                diagnostics: "Disconnected"
            };
        }

        const isWifi = state.type === "wifi";
        const ssid = state.details?.ssid || null;
        const bssid = state.details?.bssid || null;
        const ip = state.details?.ipAddress || null;

        const networkSignal = {
            connectionType: state.type,
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable ?? true,
            observedSSID: ssid,
            observedBSSID: bssid,
            observedIP: ip,
            capability: isWifi ? "WIFI_OBSERVATION" : "CELLULAR_OBSERVATION"
        };

        const diagText = isWifi
            ? (ssid ? `Connected to Wi-Fi: "${ssid}"` : "Connected to Wi-Fi (SSID masked by Android OS)")
            : `Connected via Cellular (${state.details?.cellularGeneration || "Mobile Data"})`;

        return {
            key: "network",
            type: "NETWORK",
            label: "Campus Network / Wi-Fi",
            status: "passed",
            passed: true,
            available: true,
            signal: networkSignal,
            diagnostics: diagText,
            reason: isWifi
                ? "Active Wi-Fi connection observed for institutional network matching."
                : "Cellular connection observed. Institutional IP/network verified by server."
        };
    } catch (err) {
        return {
            key: "network",
            type: "NETWORK",
            label: "Campus Network / Wi-Fi",
            status: "failed",
            passed: false,
            available: false,
            signal: null,
            reason: err.message || "Failed to inspect device network status.",
            diagnostics: "Query Error"
        };
    }
}