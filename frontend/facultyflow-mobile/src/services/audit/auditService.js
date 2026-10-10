import {
    AUDIT_EVENT_TYPES,
    AUDIT_RESULT_TYPES,
    AUDIT_SCHEMA_VERSION
} from "./auditConstants";

import {
    saveAuditEvent,
    getAuditEvents,
    getAuditEventsByFaculty,
    getAuditEventsByType
} from "./auditStorage";

function createEventId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}`;
}

function createAuditEvent({
    eventType,
    result,
    facultyId = null,
    attendanceId = null,
    reason = null,
    metadata = {}
}) {
    return {
        eventId: createEventId(),
        schemaVersion: AUDIT_SCHEMA_VERSION,
        eventType,
        result,
        facultyId,
        attendanceId,
        reason,
        metadata,
        clientTimestamp: new Date().toISOString(),
        syncStatus: "PENDING"
    };
}

export function recordAuditEvent({
    eventType,
    result,
    facultyId = null,
    attendanceId = null,
    reason = null,
    metadata = {}
}) {
    if (!eventType) {
        throw new Error(
            "Audit event type is required"
        );
    }

    if (!result) {
        throw new Error(
            "Audit result is required"
        );
    }

    const event = createAuditEvent({
        eventType,
        result,
        facultyId,
        attendanceId,
        reason,
        metadata
    });

    const saved = saveAuditEvent(event);

    if (!saved) {
        throw new Error(
            "Audit event could not be stored"
        );
    }

    return event;
}

export function recordLogin({
    facultyId,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType: AUDIT_EVENT_TYPES.LOGIN,
        result: AUDIT_RESULT_TYPES.SUCCESS,
        facultyId,
        metadata
    });
}

export function recordLogout({
    facultyId,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType: AUDIT_EVENT_TYPES.LOGOUT,
        result: AUDIT_RESULT_TYPES.SUCCESS,
        facultyId,
        metadata
    });
}

export function recordCheckInAttempt({
    facultyId,
    attendanceId = null,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.CHECK_IN_ATTEMPT,
        result: AUDIT_RESULT_TYPES.ATTEMPTED,
        facultyId,
        attendanceId,
        metadata
    });
}

export function recordCheckInSuccess({
    facultyId,
    attendanceId = null,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.CHECK_IN_SUCCESS,
        result: AUDIT_RESULT_TYPES.SUCCESS,
        facultyId,
        attendanceId,
        metadata
    });
}

export function recordCheckInFailure({
    facultyId,
    attendanceId = null,
    reason,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.CHECK_IN_FAILED,
        result: AUDIT_RESULT_TYPES.FAILED,
        facultyId,
        attendanceId,
        reason,
        metadata
    });
}

export function recordCheckOutAttempt({
    facultyId,
    attendanceId = null,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.CHECK_OUT_ATTEMPT,
        result: AUDIT_RESULT_TYPES.ATTEMPTED,
        facultyId,
        attendanceId,
        metadata
    });
}

export function recordCheckOutSuccess({
    facultyId,
    attendanceId = null,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.CHECK_OUT_SUCCESS,
        result: AUDIT_RESULT_TYPES.SUCCESS,
        facultyId,
        attendanceId,
        metadata
    });
}

export function recordCheckOutFailure({
    facultyId,
    attendanceId = null,
    reason,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.CHECK_OUT_FAILED,
        result: AUDIT_RESULT_TYPES.FAILED,
        facultyId,
        attendanceId,
        reason,
        metadata
    });
}

export function recordSyncQueued({
    facultyId,
    attendanceId = null,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.SYNC_QUEUED,
        result: AUDIT_RESULT_TYPES.PENDING,
        facultyId,
        attendanceId,
        metadata
    });
}

export function recordSyncSuccess({
    facultyId,
    attendanceId = null,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.SYNC_SUCCESS,
        result: AUDIT_RESULT_TYPES.SUCCESS,
        facultyId,
        attendanceId,
        metadata
    });
}

export function recordSyncFailure({
    facultyId,
    attendanceId = null,
    reason,
    metadata = {}
}) {
    return recordAuditEvent({
        eventType:
            AUDIT_EVENT_TYPES.SYNC_FAILED,
        result: AUDIT_RESULT_TYPES.FAILED,
        facultyId,
        attendanceId,
        reason,
        metadata
    });
}

export function getAllAuditEvents() {
    return getAuditEvents();
}

export function getFacultyAuditEvents(
    facultyId
) {
    return getAuditEventsByFaculty(
        facultyId
    );
}

export function getAuditEventsOfType(
    eventType
) {
    return getAuditEventsByType(
        eventType
    );
}