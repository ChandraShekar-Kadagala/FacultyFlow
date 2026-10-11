import {
    isNetworkConnected,
    getNetworkState,
    subscribeNetworkStatus,
    setMockNetworkStatus
} from "./networkMonitor.js";

/**
 * Backward-compatible connectivity service delegating to the unified network monitor.
 */
export async function isOnline() {
    return isNetworkConnected();
}

export async function getConnectivityStatus() {
    const online = await isNetworkConnected();
    return online ? "ONLINE" : "OFFLINE";
}

export function subscribeToConnectivity(onOnline, onOffline) {
    return subscribeNetworkStatus((connected) => {
        if (connected && typeof onOnline === "function") {
            onOnline();
        } else if (!connected && typeof onOffline === "function") {
            onOffline();
        }
    });
}

export {
    isNetworkConnected,
    getNetworkState,
    subscribeNetworkStatus,
    setMockNetworkStatus
};

export default {
    isOnline,
    getConnectivityStatus,
    subscribeToConnectivity
};