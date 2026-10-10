import AuditLog
    from "../../models/AuditLog.js";

import {
    AUDIT_RESULTS,
    AUDIT_TARGET_TYPES
} from "./auditConstants.js";


// ============================================================
// GENERATE AUDIT ID
// ============================================================

function generateAuditId() {

    return `AUD-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

}


// ============================================================
// CREATE AUDIT LOG
// ============================================================

export async function createAuditLog({

    actorId,

    actorRole,

    action,

    targetType,

    targetId = null,

    result,

    reason = null,

    metadata = {}

}) {

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!actorId) {

        throw new Error(
            "Audit actor ID is required."
        );

    }


    if (!actorRole) {

        throw new Error(
            "Audit actor role is required."
        );

    }


    if (!action) {

        throw new Error(
            "Audit action is required."
        );

    }


    if (!targetType) {

        throw new Error(
            "Audit target type is required."
        );

    }


    if (!result) {

        throw new Error(
            "Audit result is required."
        );

    }


    // --------------------------------------------------------
    // CREATE AUDIT LOG
    // --------------------------------------------------------

    const auditLog =
        await AuditLog.create({

            auditId:
                generateAuditId(),

            actorId,

            actorRole,

            action,

            targetType,

            targetId,

            result,

            reason,

            metadata,

            // ------------------------------------------------
            // SERVER AUTHORITATIVE TIMESTAMP
            // ------------------------------------------------

            timestamp:
                new Date()

        });


    return auditLog;

}


// ============================================================
// ATTENDANCE AUDIT — ATTEMPT
// ============================================================

export async function recordAttendanceAttempt({

    actorId,

    actorRole,

    action,

    facultyId

}) {

    return createAuditLog({

        actorId,

        actorRole,

        action,

        targetType:
            AUDIT_TARGET_TYPES.ATTENDANCE,

        targetId:
            facultyId,

        result:
            AUDIT_RESULTS.ATTEMPTED,

        reason:
            "Attendance action initiated.",

        metadata: {

            facultyId

        }

    });

}


// ============================================================
// ATTENDANCE AUDIT — SUCCESS
// ============================================================

export async function recordAttendanceSuccess({

    actorId,

    actorRole,

    action,

    facultyId,

    attendanceId

}) {

    return createAuditLog({

        actorId,

        actorRole,

        action,

        targetType:
            AUDIT_TARGET_TYPES.ATTENDANCE,

        targetId:
            attendanceId,

        result:
            AUDIT_RESULTS.SUCCESS,

        reason:
            "Attendance action completed successfully.",

        metadata: {

            facultyId,

            attendanceId

        }

    });

}


// ============================================================
// ATTENDANCE AUDIT — FAILURE
// ============================================================

export async function recordAttendanceFailure({

    actorId,

    actorRole,

    action,

    facultyId,

    reason,

    attendanceId = null

}) {

    return createAuditLog({

        actorId,

        actorRole,

        action,

        targetType:
            AUDIT_TARGET_TYPES.ATTENDANCE,

        targetId:
            attendanceId ||
            facultyId,

        result:
            AUDIT_RESULTS.FAILED,

        reason,

        metadata: {

            facultyId,

            attendanceId

        }

    });

}


// ============================================================
// POLICY AUDIT — ATTEMPT
// ============================================================

export async function recordPolicyAttempt({

    actorId,

    actorRole,

    action,

    policyId = null,

    metadata = {}

}) {

    return createAuditLog({

        actorId,

        actorRole,

        action,

        targetType:
            AUDIT_TARGET_TYPES.POLICY,

        targetId:
            policyId,

        result:
            AUDIT_RESULTS.ATTEMPTED,

        reason:
            "Attendance policy action initiated.",

        metadata: {

            policyId,

            ...metadata

        }

    });

}


// ============================================================
// POLICY AUDIT — SUCCESS
// ============================================================

export async function recordPolicySuccess({

    actorId,

    actorRole,

    action,

    policyId = null,

    metadata = {}

}) {

    return createAuditLog({

        actorId,

        actorRole,

        action,

        targetType:
            AUDIT_TARGET_TYPES.POLICY,

        targetId:
            policyId,

        result:
            AUDIT_RESULTS.SUCCESS,

        reason:
            "Attendance policy action completed successfully.",

        metadata: {

            policyId,

            ...metadata

        }

    });

}


// ============================================================
// POLICY AUDIT — FAILURE
// ============================================================

export async function recordPolicyFailure({

    actorId,

    actorRole,

    action,

    policyId = null,

    reason,

    metadata = {}

}) {

    return createAuditLog({

        actorId,

        actorRole,

        action,

        targetType:
            AUDIT_TARGET_TYPES.POLICY,

        targetId:
            policyId,

        result:
            AUDIT_RESULTS.FAILED,

        reason:
            reason ||
            "Attendance policy action failed.",

        metadata: {

            policyId,

            ...metadata

        }

    });

}

// ============================================================
// SYNC AUDIT — ATTEMPT
// ============================================================

export async function recordSyncAttempt({
    actorId,
    actorRole,
    eventId,
    metadata = {}
}) {
    return createAuditLog({
        actorId,
        actorRole,
        action: AUDIT_ACTIONS.SYNC_EVENT_ATTEMPT,
        targetType: AUDIT_TARGET_TYPES.SYNC,
        targetId: eventId,
        result: AUDIT_RESULTS.ATTEMPTED,
        reason: "Sync event processing initiated.",
        metadata: {
            eventId,
            ...metadata
        }
    });
}

// ============================================================
// SYNC AUDIT — SUCCESS
// ============================================================

export async function recordSyncSuccess({
    actorId,
    actorRole,
    eventId,
    metadata = {}
}) {
    return createAuditLog({
        actorId,
        actorRole,
        action: AUDIT_ACTIONS.SYNC_EVENT_SUCCESS,
        targetType: AUDIT_TARGET_TYPES.SYNC,
        targetId: eventId,
        result: AUDIT_RESULTS.SUCCESS,
        reason: "Sync event processing completed successfully.",
        metadata: {
            eventId,
            ...metadata
        }
    });
}

// ============================================================
// SYNC AUDIT — FAILURE
// ============================================================

export async function recordSyncFailure({
    actorId,
    actorRole,
    eventId,
    reason,
    metadata = {}
}) {
    return createAuditLog({
        actorId,
        actorRole,
        action: AUDIT_ACTIONS.SYNC_EVENT_FAILED,
        targetType: AUDIT_TARGET_TYPES.SYNC,
        targetId: eventId,
        result: AUDIT_RESULTS.FAILED,
        reason: reason || "Sync event processing failed.",
        metadata: {
            eventId,
            ...metadata
        }
    });
}