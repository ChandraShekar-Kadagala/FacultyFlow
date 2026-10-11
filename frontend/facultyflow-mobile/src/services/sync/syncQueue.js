import {
    enqueueOfflineEvent,
    getPendingEvents,
    updateEventStatus,
    markEventSynced,
    markEventFailed
} from "../storage/sqliteQueue.js";

export async function enqueueEvent(event, userId = "DEFAULT_USER") {
    return enqueueOfflineEvent({
        eventId: event.eventId,
        userId: event.userId || event.facultyId || userId,
        eventType: event.eventType,
        payload: event.payload || {},
        clientTimestamp: event.createdAt || event.clientTimestamp
    });
}

export async function getQueue(userId = "DEFAULT_USER") {
    return getPendingEvents(userId);
}

export async function removeFromQueue(eventId) {
    return markEventSynced(eventId);
}

export async function markRetry(eventId, errorMessage) {
    return updateEventStatus(eventId, "PENDING", {
        lastError: errorMessage
    });
}

export async function markFailed(eventId, errorMessage) {
    return markEventFailed(eventId, errorMessage);
}

export default {
    enqueueEvent,
    getQueue,
    removeFromQueue,
    markRetry,
    markFailed
};