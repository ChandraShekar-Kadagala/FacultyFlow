import {
    SYNC_STORAGE_KEY,
    SYNC_STATUS
} from "./syncConstants";


function readSyncQueue() {

    try {

        const stored =
            localStorage.getItem(
                SYNC_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed;

    } catch (error) {

        console.error(
            "Failed to read sync queue:",
            error
        );

        return [];
    }
}


function writeSyncQueue(
    events
) {

    try {

        localStorage.setItem(
            SYNC_STORAGE_KEY,
            JSON.stringify(events)
        );

        return true;

    } catch (error) {

        console.error(
            "Failed to write sync queue:",
            error
        );

        return false;
    }
}


/* =========================================
   ADD
========================================= */

export function addToSyncQueue(
    event
) {

    const queue =
        readSyncQueue();

    queue.push(event);

    return writeSyncQueue(
        queue
    );
}


/* =========================================
   GET ALL
========================================= */

export function getSyncQueue() {

    return readSyncQueue();
}


/* =========================================
   GET BY EVENT ID
========================================= */

export function getSyncEventById(
    eventId
) {

    if (!eventId) {
        return null;
    }

    const queue =
        readSyncQueue();

    return (
        queue.find(
            event =>
                event.eventId ===
                eventId
        ) || null
    );
}


/* =========================================
   UPDATE
========================================= */

export function updateSyncEvent(
    eventId,
    updates
) {

    if (!eventId) {
        return false;
    }

    const queue =
        readSyncQueue();

    const index =
        queue.findIndex(
            event =>
                event.eventId ===
                eventId
        );

    if (index === -1) {
        return false;
    }

    queue[index] = {
        ...queue[index],
        ...updates
    };

    return writeSyncQueue(
        queue
    );
}


/* =========================================
   REMOVE
========================================= */

export function removeSyncEvent(
    eventId
) {

    const queue =
        readSyncQueue();

    const filtered =
        queue.filter(
            event =>
                event.eventId !==
                eventId
        );

    return writeSyncQueue(
        filtered
    );
}


/* =========================================
   GET BY STATUS
========================================= */

export function getEventsByStatus(
    status
) {

    const queue =
        readSyncQueue();

    return queue.filter(
        event =>
            event.status === status
    );
}


/* =========================================
   GET RETRYABLE EVENTS
========================================= */

export function getRetryableEvents() {

    const queue =
        readSyncQueue();

    return queue.filter(
        event =>
            event.status ===
                SYNC_STATUS.PENDING ||
            event.status ===
                SYNC_STATUS.FAILED
    );
}


/* =========================================
   GET PENDING EVENTS
========================================= */

export function getPendingEvents() {

    return getEventsByStatus(
        SYNC_STATUS.PENDING
    );
}


/* =========================================
   GET QUEUE SIZE
========================================= */

export function getSyncQueueSize() {

    return readSyncQueue().length;
}


/* =========================================
   CLEAR
========================================= */

export function clearSyncQueue() {

    try {

        localStorage.removeItem(
            SYNC_STORAGE_KEY
        );

        return true;

    } catch (error) {

        console.error(
            "Failed to clear sync queue:",
            error
        );

        return false;
    }
}