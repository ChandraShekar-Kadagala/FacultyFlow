import {
    getSyncEventById,
    addToSyncQueue
} from "./syncStorage";


import {
    SYNC_RESULT,
    SYNC_STATUS
} from "./syncConstants";


import {
    recordSyncQueued
} from "../audit/auditService";


function createEventId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {
        return crypto.randomUUID();
    }


    return (
        "event_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


export function generateEventId() {

    return createEventId();
}


export function checkEventIdempotency(
    eventId
) {

    if (!eventId) {

        throw new Error(
            "Event ID is required for idempotency check"
        );
    }


    const existingEvent =
        getSyncEventById(
            eventId
        );


    if (existingEvent) {

        return {

            result:
                SYNC_RESULT.DUPLICATE,

            event:
                existingEvent
        };
    }


    return {

        result:
            SYNC_RESULT.NEW,

        event:
            null
    };
}


export function enqueueIdempotentEvent(
    event
) {

    if (!event?.eventId) {

        throw new Error(
            "Event ID is required"
        );
    }


    const idempotencyCheck =
        checkEventIdempotency(
            event.eventId
        );


    if (
        idempotencyCheck.result ===
        SYNC_RESULT.DUPLICATE
    ) {

        return {

            result:
                SYNC_RESULT.DUPLICATE,

            event:
                idempotencyCheck.event
        };
    }


    const eventToStore = {

        ...event,

        status:
            SYNC_STATUS.PENDING,

        retryCount:
            event.retryCount || 0
    };


    const saved =
        addToSyncQueue(
            eventToStore
        );


    if (!saved) {

        throw new Error(
            "Failed to enqueue event"
        );
    }


    recordSyncQueued(
        eventToStore
    );


    return {

        result:
            SYNC_RESULT.NEW,

        event:
            eventToStore
    };
}


export function createIdempotentEvent(
    event
) {

    const eventWithId = {

        ...event,

        eventId:
            event?.eventId ||
            generateEventId()
    };


    return enqueueIdempotentEvent(
        eventWithId
    );
}