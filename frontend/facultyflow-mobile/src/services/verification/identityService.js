/**
 * Validates authenticated faculty identity claims before check-in.
 */
export async function verifyIdentity(user) {
    if (!user) {
        return {
            key: "identity",
            type: "IDENTITY",
            label: "Faculty Identity & Session",
            status: "failed",
            passed: false,
            available: true,
            reason: "Active faculty session is required.",
            diagnostics: "Unauthenticated"
        };
    }

    const facultyId = user.facultyId || user.userId || user.id;

    if (!facultyId || !user.role) {
        return {
            key: "identity",
            type: "IDENTITY",
            label: "Faculty Identity & Session",
            status: "failed",
            passed: false,
            available: true,
            reason: "Authenticated user identity claims are incomplete.",
            diagnostics: "Incomplete Profile"
        };
    }

    return {
        key: "identity",
        type: "IDENTITY",
        label: "Faculty Identity & Session",
        status: "passed",
        passed: true,
        available: true,
        reason: "Active session matches authorized faculty credentials.",
        diagnostics: `${user.name || "Faculty Member"} (${facultyId})`
    };
}