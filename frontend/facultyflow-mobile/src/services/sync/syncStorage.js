import {
    SYNC_STORAGE_KEY,
    SYNC_STATUS
} from "./syncConstants";

function readSyncQueue() {
    try {
        const storedQueue = localStorage.getItem(
            SYNC_STORAGE_KEY
        );

        if (!storedQueue) {
            return [];
        }

        const parsedQueue = JSON.parse(
            storedQueue
        );

        if (!Array.isArray(parsedQueue)) {
            return [];
        }

        return parsedQueue;

    } catch (error) {
        console.error(
            "Failed to read sync queue:",
            error
        );

        return [];
    }
}


function writeSyncQueue(queue) {
    try {
        localStorage.setItem(
            SYNC_STORAGE_KEY,
            JSON.stringify(queue)
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


export function addToSyncQueue(event) {
    const existingQueue = readSyncQueue();

    const updatedQueue = [
        ...existingQueue,
        event
    ];

    return writeSyncQueue(updatedQueue);
}


export function getSyncQueue() {
    return readSyncQueue();
}


export function getPendingSyncEvents() {
    const queue = readSyncQueue();

    return queue.filter(
        event => event.status === "PENDING_SYNC"
    );
}


export function getSyncEventById(eventId) {
    const queue = readSyncQueue();

    return queue.find(
        event => event.eventId === eventId
    );
}


export function updateSyncEvent(
    eventId,
    updates
) {
    const queue = readSyncQueue();

    const updatedQueue = queue.map(event => {
        if (event.eventId !== eventId) {
            return event;
        }

        return {
            ...event,
            ...updates
        };
    });

    return writeSyncQueue(updatedQueue);
}


export function removeSyncEvent(eventId) {
    const queue = readSyncQueue();

    const updatedQueue = queue.filter(
        event => event.eventId !== eventId
    );

    return writeSyncQueue(updatedQueue);
}


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

export function getSyncQueueSize() {
    const queue = readSyncQueue();
    return queue.length;
}

export function getRetryableEvents() {
    const queue = readSyncQueue();

    return queue.filter(
        event =>
            event.status === SYNC_STATUS.PENDING ||
            event.status === SYNC_STATUS.FAILED
    );
}