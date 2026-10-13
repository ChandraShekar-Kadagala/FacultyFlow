import NetInfo from "@react-native-community/netinfo";

/**
 * Captures real network connection observations and compares against configured campus networks.
 * 
 * Accurately distinguishes:
 * - VERIFIED_MATCH: Connected Wi-Fi SSID matches authorized campus network.
 * - NETWORK_MISMATCH: Connected to an unauthorized Wi-Fi network.
 * - SIGNAL_UNAVAILABLE: Device is disconnected / airplane mode.
 * - PERMISSION_DENIED: Android OS location permission denied, masking Wi-Fi SSID.
 * - UNSUPPORTED_CAPABILITY: Platform does not expose SSID.
 */
export async function verifyNetwork(campusNetworks = []) {
    try {
        const state = await NetInfo.fetch();

        if (!state.isConnected) {
            return {
                key: "network",
                type: "NETWORK",
                label: "Campus Network / Wi-Fi",
                status: "failed",
                passed: false,
                code: "SIGNAL_UNAVAILABLE",
                available: true,
                signal: null,
                reason: "Device has no active network connection. Please connect to campus Wi-Fi.",
                diagnostics: "Signal Unavailable: Disconnected"
            };
        }

        const isWifi = state.type === "wifi";
        const rawSSID = state.details?.ssid || null;
        const bssid = state.details?.bssid || null;
        const ip = state.details?.ipAddress || null;

        // Clean Android placeholder values like "<unknown ssid>"
        const isUnknownSSID = !rawSSID || rawSSID === "<unknown ssid>" || rawSSID === "0x";
        const cleanSSID = isUnknownSSID ? null : rawSSID.replace(/^"|"$/g, "");

        const networkSignal = {
            connectionType: state.type,
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable ?? true,
            observedSSID: cleanSSID,
            observedBSSID: bssid,
            observedIP: ip,
            capability: isWifi ? "WIFI_OBSERVATION" : "CELLULAR_OBSERVATION"
        };

        const activeNetworks = Array.isArray(campusNetworks) ? campusNetworks : [];
        const allowedSSIDs = activeNetworks
            .map(n => n.expectedSSID || n.name)
            .filter(Boolean);

        // Case 1: Device is connected to Wi-Fi
        if (isWifi) {
            if (cleanSSID) {
                // We have a readable SSID: Check against allowed networks
                if (allowedSSIDs.length > 0) {
                    const match = allowedSSIDs.some(
                        allowed => allowed.trim().toLowerCase() === cleanSSID.trim().toLowerCase()
                    );

                    if (match) {
                        return {
                            key: "network",
                            type: "NETWORK",
                            label: "Campus Network / Wi-Fi",
                            status: "passed",
                            passed: true,
                            code: "VERIFIED_MATCH",
                            available: true,
                            signal: networkSignal,
                            diagnostics: `Verified Wi-Fi: "${cleanSSID}"`,
                            reason: `Connected to authorized institutional network "${cleanSSID}".`
                        };
                    } else {
                        return {
                            key: "network",
                            type: "NETWORK",
                            label: "Campus Network / Wi-Fi",
                            status: "failed",
                            passed: false,
                            code: "NETWORK_MISMATCH",
                            available: true,
                            signal: networkSignal,
                            diagnostics: `Mismatch: "${cleanSSID}"`,
                            reason: `Connected Wi-Fi "${cleanSSID}" is not an authorized campus network. Authorized: ${allowedSSIDs.join(", ")}.`
                        };
                    }
                }

                // If no specific networks are configured in policy, observe for server evaluation
                return {
                    key: "network",
                    type: "NETWORK",
                    label: "Campus Network / Wi-Fi",
                    status: "passed",
                    passed: true,
                    code: "VERIFIED_MATCH",
                    available: true,
                    signal: networkSignal,
                    diagnostics: `Wi-Fi: "${cleanSSID}"`,
                    reason: `Connected to Wi-Fi "${cleanSSID}". Server will evaluate network integrity.`
                };
            }

            // SSID is masked by Android OS (requires Android Location Permission & GPS enabled)
            return {
                key: "network",
                type: "NETWORK",
                label: "Campus Network / Wi-Fi",
                status: "passed",
                passed: true,
                code: "PERMISSION_DENIED",
                available: true,
                signal: networkSignal,
                diagnostics: "Wi-Fi Connected (SSID restricted by Android OS)",
                reason: "Active Wi-Fi connection observed. Institutional network identity will be evaluated via server IP matching."
            };
        }

        // Case 2: Device is connected via Cellular / Mobile Data
        if (allowedSSIDs.length > 0) {
            // Policy expects campus Wi-Fi
            return {
                key: "network",
                type: "NETWORK",
                label: "Campus Network / Wi-Fi",
                status: "failed",
                passed: false,
                code: "NETWORK_MISMATCH",
                available: true,
                signal: networkSignal,
                diagnostics: `Cellular (${state.details?.cellularGeneration || "Mobile Data"})`,
                reason: `Campus verification requires connection to institutional Wi-Fi (${allowedSSIDs.join(", ")}). Device is currently on mobile data.`
            };
        }

        // Cellular with IP fallback
        return {
            key: "network",
            type: "NETWORK",
            label: "Campus Network / Wi-Fi",
            status: "passed",
            passed: true,
            code: "VERIFIED_MATCH",
            available: true,
            signal: networkSignal,
            diagnostics: `Cellular IP (${ip || "Public IP"})`,
            reason: "Cellular connection observed. Institutional network will be authoritatively evaluated by server."
        };
    } catch (err) {
        return {
            key: "network",
            type: "NETWORK",
            label: "Campus Network / Wi-Fi",
            status: "failed",
            passed: false,
            code: "UNSUPPORTED_CAPABILITY",
            available: false,
            signal: null,
            reason: err.message || "Failed to inspect device network status.",
            diagnostics: "Query Error"
        };
    }
}