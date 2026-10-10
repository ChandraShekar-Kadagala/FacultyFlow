// ============================================================
// AUDIT ACTION TYPES
// ============================================================

export const AUDIT_ACTIONS = {

    // --------------------------------------------------------
    // ATTENDANCE
    // --------------------------------------------------------

    CHECK_IN_ATTEMPT:
        "CHECK_IN_ATTEMPT",

    CHECK_IN_SUCCESS:
        "CHECK_IN_SUCCESS",

    CHECK_IN_FAILED:
        "CHECK_IN_FAILED",

    CHECK_OUT_ATTEMPT:
        "CHECK_OUT_ATTEMPT",

    CHECK_OUT_SUCCESS:
        "CHECK_OUT_SUCCESS",

    CHECK_OUT_FAILED:
        "CHECK_OUT_FAILED",


    // --------------------------------------------------------
    // SYNC
    // --------------------------------------------------------

    SYNC_EVENT_ATTEMPT:
        "SYNC_EVENT_ATTEMPT",

    SYNC_EVENT_SUCCESS:
        "SYNC_EVENT_SUCCESS",

    SYNC_EVENT_FAILED:
        "SYNC_EVENT_FAILED",

    // --------------------------------------------------------
    // ATTENDANCE POLICY
    // --------------------------------------------------------

    POLICY_CREATE_ATTEMPT:
        "POLICY_CREATE_ATTEMPT",

    POLICY_CREATE_SUCCESS:
        "POLICY_CREATE_SUCCESS",

    POLICY_CREATE_FAILED:
        "POLICY_CREATE_FAILED",

    POLICY_UPDATE_ATTEMPT:
        "POLICY_UPDATE_ATTEMPT",

    POLICY_UPDATE_SUCCESS:
        "POLICY_UPDATE_SUCCESS",

    POLICY_UPDATE_FAILED:
        "POLICY_UPDATE_FAILED",

    POLICY_ACTIVATE_ATTEMPT:
        "POLICY_ACTIVATE_ATTEMPT",

    POLICY_ACTIVATE_SUCCESS:
        "POLICY_ACTIVATE_SUCCESS",

    POLICY_ACTIVATE_FAILED:
        "POLICY_ACTIVATE_FAILED",

    POLICY_DEACTIVATE_ATTEMPT:
        "POLICY_DEACTIVATE_ATTEMPT",

    POLICY_DEACTIVATE_SUCCESS:
        "POLICY_DEACTIVATE_SUCCESS",

    POLICY_DEACTIVATE_FAILED:
        "POLICY_DEACTIVATE_FAILED"

};


// ============================================================
// AUDIT RESULT TYPES
// ============================================================

export const AUDIT_RESULTS = {

    ATTEMPTED:
        "ATTEMPTED",

    SUCCESS:
        "SUCCESS",

    FAILED:
        "FAILED"

};


// ============================================================
// AUDIT TARGET TYPES
// ============================================================

export const AUDIT_TARGET_TYPES = {

    ATTENDANCE:
        "ATTENDANCE",

    FACULTY:
        "FACULTY",

    POLICY:
        "POLICY",

    SYNC:
        "SYNC",

    SYSTEM:
        "SYSTEM"

};