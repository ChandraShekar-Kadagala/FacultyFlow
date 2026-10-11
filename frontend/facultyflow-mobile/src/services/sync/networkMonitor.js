/**
 * ============================================================
 * FacultyFlow Mobile — Network Connectivity Monitor
 * ============================================================
 * Safely wraps `@react-native-community/netinfo` to provide reliable
 * network connectivity observation and offline/online change events.
 *
 * Designed to work across:
 * - Real Android & iOS devices (native NetInfo module)
 * - Web and Expo Go environments
 * - Node.js automated test runners (with mockable network state)
 */

let netInfoModule = null;
let isModuleResolved = false;

// Mock / override state for automated testing and offline simulation
let mockConnectedState = null;
const listeners = new Set();

async function resolveNetInfo() {
    if (isModuleResolved) return netInfoModule;

    try {
        const mod = await import("@react-native-community/netinfo");
        // Check for addEventListener or default export
        if (mod?.addEventListener || mod?.default?.addEventListener) {
            netInfoModule = mod.default || mod;
        } else {
            netInfoModule = null;
        }
    } catch (_err) {
        netInfoModule = null;
    }

    isModuleResolved = true;
    return netInfoModule;
}

/**
 * Checks whether the device is currently connected to the internet.
 * @returns {Promise<boolean>}
 */
export async function isNetworkConnected() {
    if (mockConnectedState !== null) {
        return Boolean(mockConnectedState);
    }

    const netInfo = await resolveNetInfo();
    if (netInfo && typeof netInfo.fetch === "function") {
        try {
            const state = await netInfo.fetch();
            return Boolean(state?.isConnected && state?.isInternetReachable !== false);
        } catch (_err) {
            return true;
        }
    }

    // In browser web environment
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
        return navigator.onLine;
    }

    // Default to online in environments without NetInfo
    return true;
}

/**
 * Retrieves full network state details.
 */
export async function getNetworkState() {
    if (mockConnectedState !== null) {
        return {
            isConnected: Boolean(mockConnectedState),
            isInternetReachable: Boolean(mockConnectedState),
            type: mockConnectedState ? "wifi" : "none"
        };
    }

    const netInfo = await resolveNetInfo();
    if (netInfo && typeof netInfo.fetch === "function") {
        try {
            return await netInfo.fetch();
        } catch (_err) {
            return { isConnected: true, isInternetReachable: true, type: "unknown" };
        }
    }

    const online = typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
        ? navigator.onLine
        : true;

    return {
        isConnected: online,
        isInternetReachable: online,
        type: online ? "cellular" : "none"
    };
}

/**
 * Subscribes to network connectivity state changes.
 *
 * @param {Function} callback - Called with (isConnected: boolean)
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeNetworkStatus(callback) {
    if (typeof callback !== "function") return () => {};

    listeners.add(callback);

    let nativeUnsubscribe = null;

    resolveNetInfo().then((netInfo) => {
        if (netInfo && typeof netInfo.addEventListener === "function") {
            try {
                nativeUnsubscribe = netInfo.addEventListener((state) => {
                    if (mockConnectedState === null) {
                        const connected = Boolean(state?.isConnected && state?.isInternetReachable !== false);
                        callback(connected);
                    }
                });
            } catch (_err) {
                nativeUnsubscribe = null;
            }
        } else if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
            const handleOnline = () => {
                if (mockConnectedState === null) callback(true);
            };
            const handleOffline = () => {
                if (mockConnectedState === null) callback(false);
            };

            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);

            nativeUnsubscribe = () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
            };
        }
    });

    return () => {
        listeners.delete(callback);
        if (typeof nativeUnsubscribe === "function") {
            nativeUnsubscribe();
        }
    };
}

/**
 * Helper for automated testing to simulate network drops and restorations.
 *
 * @param {boolean|null} isConnected - true (online), false (offline), or null (reset to real network)
 */
export function setMockNetworkStatus(isConnected) {
    mockConnectedState = isConnected;

    if (isConnected !== null) {
        // Notify all registered listeners of the simulated transition
        listeners.forEach((listener) => {
            try {
                listener(Boolean(isConnected));
            } catch (err) {
                console.error("Network listener error:", err);
            }
        });
    }
}

export default {
    isNetworkConnected,
    getNetworkState,
    subscribeNetworkStatus,
    setMockNetworkStatus
};
