import apiRequest
    from "../api/apiClient";


// ============================================================
// POLICY API SERVICE
// ============================================================
//
// Central service for all attendance-policy API operations.
//
// Backend endpoints:
//
// GET    /api/admin/policy/active
// GET    /api/admin/policy
// GET    /api/admin/policy/:policyId
// POST   /api/admin/policy
// PUT    /api/admin/policy/:policyId
// PATCH  /api/admin/policy/:policyId/activate
// PATCH  /api/admin/policy/:policyId/deactivate
//
// ============================================================


// ============================================================
// GET ACTIVE POLICY
// ============================================================

export async function getActiveAttendancePolicy(
    accessToken
) {

    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        "/admin/policy/active",
        {
            method: "GET",
            token: accessToken
        }
    );

}


// ============================================================
// GET ALL POLICIES
// ============================================================

export async function getAttendancePolicies(
    accessToken
) {

    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        "/admin/policy",
        {
            method: "GET",
            token: accessToken
        }
    );

}


// ============================================================
// GET POLICY BY ID
// ============================================================

export async function getAttendancePolicyById(
    policyId,
    accessToken
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        `/admin/policy/${encodeURIComponent(policyId)}`,
        {
            method: "GET",
            token: accessToken
        }
    );

}


// ============================================================
// CREATE POLICY
// ============================================================

export async function createAttendancePolicy(
    policy,
    accessToken
) {

    if (!policy) {

        const error =
            new Error(
                "Policy data is required."
            );

        error.code =
            "POLICY_DATA_REQUIRED";

        throw error;

    }


    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        "/admin/policy",
        {
            method: "POST",
            body: policy,
            token: accessToken
        }
    );

}


// ============================================================
// UPDATE POLICY
// ============================================================

export async function updateAttendancePolicy(
    policyId,
    policy,
    accessToken
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    if (!policy) {

        const error =
            new Error(
                "Policy data is required."
            );

        error.code =
            "POLICY_DATA_REQUIRED";

        throw error;

    }


    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        `/admin/policy/${encodeURIComponent(policyId)}`,
        {
            method: "PUT",
            body: policy,
            token: accessToken
        }
    );

}


// ============================================================
// SMART CREATE / UPDATE
// ============================================================
//
// If policy.policyId exists:
//     UPDATE
//
// If policy.policyId does not exist:
//     CREATE
//
// ============================================================

export async function saveAttendancePolicy(
    policy,
    accessToken
) {

    if (!policy) {

        const error =
            new Error(
                "Policy data is required."
            );

        error.code =
            "POLICY_DATA_REQUIRED";

        throw error;

    }


    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    // --------------------------------------------------------
    // UPDATE EXISTING POLICY
    // --------------------------------------------------------

    if (policy.policyId) {

        return await updateAttendancePolicy(
            policy.policyId,
            policy,
            accessToken
        );

    }


    // --------------------------------------------------------
    // CREATE NEW POLICY
    // --------------------------------------------------------

    return await createAttendancePolicy(
        policy,
        accessToken
    );

}


// ============================================================
// ACTIVATE POLICY
// ============================================================

export async function activateAttendancePolicy(
    policyId,
    accessToken
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        `/admin/policy/${encodeURIComponent(policyId)}/activate`,
        {
            method: "PATCH",
            token: accessToken
        }
    );

}


// ============================================================
// DEACTIVATE POLICY
// ============================================================

export async function deactivateAttendancePolicy(
    policyId,
    accessToken
) {

    if (!policyId) {

        const error =
            new Error(
                "Policy ID is required."
            );

        error.code =
            "POLICY_ID_REQUIRED";

        throw error;

    }


    if (!accessToken) {

        const error =
            new Error(
                "Authentication session is missing."
            );

        error.code =
            "AUTH_TOKEN_MISSING";

        throw error;

    }


    return await apiRequest(
        `/admin/policy/${encodeURIComponent(policyId)}/deactivate`,
        {
            method: "PATCH",
            token: accessToken
        }
    );

}
