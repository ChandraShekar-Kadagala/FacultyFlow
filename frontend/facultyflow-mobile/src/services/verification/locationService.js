export async function verifyLocation() {
    return {
        key: "location",
        label: "Campus Location",
        status: "unavailable",
        passed: false,
        available: false,
        reason: "Location verification is not connected yet."
    };
}