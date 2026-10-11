import {
    enqueueOfflineEvent,
    getPendingEvents,
    getAllEventsForUser,
    getEventById,
    updateEventStatus,
    markEventSynced,
    clearUserQueue,
    getPendingCount
} from "../storage/sqliteQueue.js";

import { SYNC_STATUS } from "./syncConstants.js";

const DEFAULT_USER = "SYSTEM_SESSION";

export async function addToSyncQueue(event, userId = DEFAULT_USER) {
    return enqueueOfflineEvent({
        eventId: event.eventId,
        userId: event.userId || event.facultyId || userId,
        eventType: event.eventType,
        payload: event.payload || {},
        clientTimestamp: event.createdAt || event.clientTimestamp
    });
}

export async function getSyncQueue(userId = DEFAULT_USER) {
    return getAllEventsForUser(userId);
}

export async function getPendingSyncEvents(userId = DEFAULT_USER) {
    return getPendingEvents(userId);
}

export async function getSyncEventById(eventId) {
    return getEventById(eventId);
}

export async function updateSyncEvent(eventId, updates) {
    return updateEventStatus(eventId, updates.status || SYNC_STATUS.PENDING, updates);
}

export async function removeSyncEvent(eventId) {
    return markEventSynced(eventId);
}

export async function clearSyncQueue(userId = DEFAULT_USER) {
    return clearUserQueue(userId);
}

export async function getSyncQueueSize(userId = DEFAULT_USER) {
    return getPendingCount(userId);
}

export async function getRetryableEvents(userId = DEFAULT_USER) {
    return getPendingEvents(userId);
}

export default {
    addToSyncQueue,
    getSyncQueue,
    getPendingSyncEvents,
    getSyncEventById,
    updateSyncEvent,
    removeSyncEvent,
    clearSyncQueue,
    getSyncQueueSize,
    getRetryableEvents
};