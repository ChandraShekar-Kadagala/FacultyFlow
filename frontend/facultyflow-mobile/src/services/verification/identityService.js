export async function verifyIdentity(user) {
    if (!user) {
        return {
            key: "identity",
            label: "Identity",
            status: "failed",
            passed: false,
            available: true,
            reason: "User authentication is required."
        };
    }

    if (!user.id || !user.role) {
        return {
            key: "identity",
            label: "Identity",
            status: "failed",
            passed: false,
            available: true,
            reason: "Authenticated user identity is incomplete."
        };
    }

    return {
        key: "identity",
        label: "Identity",
        status: "passed",
        passed: true,
        available: true,
        reason: null
    };
}