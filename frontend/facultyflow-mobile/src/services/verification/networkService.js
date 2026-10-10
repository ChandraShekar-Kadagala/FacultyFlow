export async function verifyNetwork() {
    return {
        key: "network",
        label: "University Network",
        status: "unavailable",
        passed: false,
        available: false,
        reason: "Network verification is not connected to the target platform yet."
    };
}