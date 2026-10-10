import {
    addPendingEvent,
    getPendingEvents,
    removePendingEvent,
    updatePendingEvent
} from "./storageService";

export async function enqueueEvent(event) {
    const pendingEvent = {
        ...event,
        syncStatus: "PENDING_SYNC",
        retryCount: event.retryCount || 0,
        lastSyncAttempt: null,
        lastSyncError: null
    };

    return addPendingEvent(pendingEvent);
}

export async function getQueue() {
    return getPendingEvents();
}

export async function removeFromQueue(eventId) {
    return removePendingEvent(eventId);
}

export async function markRetry(
    eventId,
    errorMessage
) {
    const queue = await getPendingEvents();

    const currentEvent = queue.find(
        event => event.eventId === eventId
    );

    const retryCount =
        (currentEvent?.retryCount || 0) + 1;

    return updatePendingEvent(
        eventId,
        {
            syncStatus: "PENDING_SYNC",
            retryCount,
            lastSyncAttempt:
                new Date().toISOString(),
            lastSyncError:
                errorMessage || "Synchronization failed"
        }
    );
}