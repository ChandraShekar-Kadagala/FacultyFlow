export async function verifyBiometric() {
    return {
        key: "biometric",
        label: "Device Biometric",
        status: "unavailable",
        passed: false,
        available: false,
        reason: "Native biometric verification is not connected yet."
    };
}