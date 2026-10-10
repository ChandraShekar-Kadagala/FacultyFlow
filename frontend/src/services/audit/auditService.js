import {
    AUDIT_EVENT_TYPES,
    AUDIT_RESULT_TYPES,
    AUDIT_SCHEMA_VERSION
} from "./auditConstants";


import {
    saveAuditEvent,
    getAuditEvents,
    getAuditEventById,
    getAuditEventsByType,
    getAuditEventsByFaculty,
    clearAuditEvents
} from "./auditStorage";


function createEventId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {
        return crypto.randomUUID();
    }


    return (
        "audit_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


function createAuditEvent({
    eventType,
    result,
    facultyId = null,
    attendanceId = null,
    actorId = null,
    targetType = null,
    targetId = null,
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


    return {

        eventId:
            createEventId(),

        schemaVersion:
            AUDIT_SCHEMA_VERSION,

        eventType,

        result,

        facultyId,

        attendanceId,

        actorId,

        targetType,

        targetId,

        reason,

        metadata,

        clientTimestamp:
            new Date().toISOString(),

        syncStatus:
            "PENDING"
    };
}


function recordAuditEvent(
    options
) {

    const event =
        createAuditEvent(
            options
        );


    const saved =
        saveAuditEvent(event);


    if (!saved) {

        throw new Error(
            "Failed to save audit event"
        );
    }


    return event;
}


/* =========================================
   AUTHENTICATION EVENTS
========================================= */


export function recordLogin(
    actorId,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES.LOGIN,

        result:
            AUDIT_RESULT_TYPES.SUCCESS,

        actorId,

        metadata
    });
}


export function recordLogout(
    actorId,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES.LOGOUT,

        result:
            AUDIT_RESULT_TYPES.SUCCESS,

        actorId,

        metadata
    });
}


/* =========================================
   CHECK-IN EVENTS
========================================= */


export function recordCheckInAttempt(
    facultyId,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .CHECK_IN_ATTEMPT,

        result:
            AUDIT_RESULT_TYPES.ATTEMPTED,

        facultyId,

        metadata
    });
}


export function recordCheckInSuccess(
    facultyId,
    attendanceId = null,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .CHECK_IN_SUCCESS,

        result:
            AUDIT_RESULT_TYPES.SUCCESS,

        facultyId,

        attendanceId,

        metadata
    });
}


export function recordCheckInFailure(
    facultyId,
    reason,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .CHECK_IN_FAILED,

        result:
            AUDIT_RESULT_TYPES.FAILED,

        facultyId,

        reason,

        metadata
    });
}


/* =========================================
   CHECK-OUT EVENTS
========================================= */


export function recordCheckOutAttempt(
    facultyId,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .CHECK_OUT_ATTEMPT,

        result:
            AUDIT_RESULT_TYPES.ATTEMPTED,

        facultyId,

        metadata
    });
}


export function recordCheckOutSuccess(
    facultyId,
    attendanceId = null,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .CHECK_OUT_SUCCESS,

        result:
            AUDIT_RESULT_TYPES.SUCCESS,

        facultyId,

        attendanceId,

        metadata
    });
}


export function recordCheckOutFailure(
    facultyId,
    reason,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .CHECK_OUT_FAILED,

        result:
            AUDIT_RESULT_TYPES.FAILED,

        facultyId,

        reason,

        metadata
    });
}


/* =========================================
   SYNC EVENTS
========================================= */


export function recordSyncQueued(
    event,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .SYNC_QUEUED,

        result:
            AUDIT_RESULT_TYPES.PENDING,

        facultyId:
            event?.facultyId ||
            null,

        attendanceId:
            event?.attendanceId ||
            null,

        metadata: {
            eventId:
                event?.eventId ||
                null,

            ...metadata
        }
    });
}


export function recordSyncSuccess(
    event,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .SYNC_SUCCESS,

        result:
            AUDIT_RESULT_TYPES.SUCCESS,

        facultyId:
            event?.facultyId ||
            null,

        attendanceId:
            event?.attendanceId ||
            null,

        metadata: {
            eventId:
                event?.eventId ||
                null,

            ...metadata
        }
    });
}


export function recordSyncFailure(
    event,
    error = null,
    metadata = {}
) {

    return recordAuditEvent({

        eventType:
            AUDIT_EVENT_TYPES
                .SYNC_FAILED,

        result:
            AUDIT_RESULT_TYPES.FAILED,

        facultyId:
            event?.facultyId ||
            null,

        attendanceId:
            event?.attendanceId ||
            null,

        reason:
            error?.message ||
            "Unknown sync error",

        metadata: {
            eventId:
                event?.eventId ||
                null,

            ...metadata
        }
    });
}


/* =========================================
   READ OPERATIONS
========================================= */


export function getAllAuditEvents() {

    return getAuditEvents();
}


export function findAuditEvent(
    eventId
) {

    return getAuditEventById(
        eventId
    );
}


export function getAuditEventsByEventType(
    eventType
) {

    return getAuditEventsByType(
        eventType
    );
}


export function getFacultyAuditEvents(
    facultyId
) {

    return getAuditEventsByFaculty(
        facultyId
    );
}


export function clearAllAuditEvents() {

    return clearAuditEvents();
}