import { getLocationSignal } from "../device/deviceLocationHelper";

/**
 * Executes location capture and prepares diagnostic verification state.
 */
export async function verifyLocation() {
    const locResult = await getLocationSignal();

    if (locResult.permissionStatus === "granted" && locResult.signal) {
        return {
            key: "location",
            type: "LOCATION",
            label: "Campus Geofence Location",
            status: "passed",
            passed: true,
            available: true,
            signal: locResult.signal,
            diagnostics: locResult.diagnostics,
            reason: "GPS coordinates captured for authoritative campus geofence evaluation."
        };
    }

    const isPermissionIssue = locResult.permissionStatus === "denied" || locResult.permissionStatus === "permanently_denied";

    return {
        key: "location",
        type: "LOCATION",
        label: "Campus Geofence Location",
        status: isPermissionIssue ? "waiting_user" : "failed",
        passed: false,
        available: locResult.permissionStatus !== "unsupported",
        signal: null,
        permissionStatus: locResult.permissionStatus,
        canAskAgain: locResult.canAskAgain,
        reason: locResult.message || "Could not obtain current location.",
        diagnostics: locResult.permissionStatus
    };
}