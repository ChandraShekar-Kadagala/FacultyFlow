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


export function checkEventIdempotency(
    eventId
) {

    if (!eventId) {

        throw new Error(
            "Event ID is required for idempotency check"
        );
    }


    const existingEvent =
        getSyncEventById(eventId);


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