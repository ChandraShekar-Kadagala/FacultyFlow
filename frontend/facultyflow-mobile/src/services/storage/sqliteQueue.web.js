/**
 * ============================================================
 * FacultyFlow Mobile — Offline Queue Service (Web Platform)
 * ============================================================
 * Provides persistent offline queue functionality for the Web
 * platform using AsyncStorage and in-memory transactional cache,
 * avoiding WebAssembly (.wasm) worker packaging issues on Web.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_STORAGE_KEY = "@facultyflow_offline_queue_web";
const memoryStore = new Map();
let autoIncrementId = 1;
let isInitialized = false;

export async function initQueueDatabase() {
    if (isInitialized) return true;

    try {
        const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                list.forEach((item) => {
                    memoryStore.set(item.event_id, item);
                    if (item.id >= autoIncrementId) {
                        autoIncrementId = item.id + 1;
                    }
                });
            }
        }
    } catch (err) {
        console.warn("Failed to load web offline queue:", err?.message);
    }

    isInitialized = true;
    return true;
}

export async function getSchemaVersion() {
    await initQueueDatabase();
    return 1;
}

async function persistToAsyncStorage() {
    try {
        const array = Array.from(memoryStore.values());
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(array));
    } catch (err) {
        console.error("Failed to persist web offline queue:", err?.message);
    }
}

export function generateSyncEventId(userId, eventType) {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const safeUser = (userId || "UNKNOWN").replace(/[^a-zA-Z0-9_-]/g, "");
    return `SYNC-${eventType}-${safeUser}-${timestamp}-${randomHex}`;
}

export async function enqueueOfflineEvent({
    eventId,
    userId,
    eventType,
    payload = {},
    clientTimestamp
}) {
    if (!eventId) throw new Error("eventId is required to enqueue offline event.");
    if (!userId) throw new Error("userId is required for account isolation.");
    if (!eventType || !["CHECK_IN", "CHECK_OUT"].includes(eventType)) {
        throw new Error("Invalid eventType. Must be 'CHECK_IN' or 'CHECK_OUT'.");
    }

    await initQueueDatabase();

    const timestamp = clientTimestamp || new Date().toISOString();
    const now = new Date().toISOString();

    if (memoryStore.has(eventId)) {
        throw new Error(`UNIQUE constraint failed: offline_events.event_id (${eventId})`);
    }

    const record = {
        id: autoIncrementId++,
        event_id: eventId,
        user_id: userId,
        event_type: eventType,
        payload_json: JSON.stringify(payload),
        client_timestamp: timestamp,
        status: "PENDING",
        attempt_count: 0,
        last_attempt_at: null,
        last_error: null,
        created_at: now,
        updated_at: now
    };

    memoryStore.set(eventId, record);
    await persistToAsyncStorage();

    return {
        id: record.id,
        eventId: record.event_id,
        userId: record.user_id,
        eventType: record.event_type,
        payload,
        clientTimestamp: record.client_timestamp,
        status: record.status,
        attemptCount: record.attempt_count,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    };
}

export async function getPendingEvents(userId) {
    if (!userId) throw new Error("userId is required for getPendingEvents.");
    await initQueueDatabase();

    const events = [];
    for (const record of memoryStore.values()) {
        if (record.user_id === userId && (record.status === "PENDING" || record.status === "SYNCING")) {
            events.push(formatRow(record));
        }
    }
    return events.sort((a, b) => a.id - b.id);
}

export async function getAllEventsForUser(userId) {
    if (!userId) throw new Error("userId is required for getAllEventsForUser.");
    await initQueueDatabase();

    const events = [];
    for (const record of memoryStore.values()) {
        if (record.user_id === userId) {
            events.push(formatRow(record));
        }
    }
    return events.sort((a, b) => b.id - a.id);
}

export async function getEventById(eventId) {
    if (!eventId) return null;
    await initQueueDatabase();
    const record = memoryStore.get(eventId);
    return record ? formatRow(record) : null;
}

export async function updateEventStatus(eventId, status, details = {}) {
    if (!eventId) throw new Error("eventId is required.");
    if (!status) throw new Error("status is required.");
    await initQueueDatabase();

    const record = memoryStore.get(eventId);
    if (!record) return null;

    const now = new Date().toISOString();
    record.status = status;
    record.updated_at = now;
    if (typeof details.attemptCount === "number") record.attempt_count = details.attemptCount;
    if (details.lastAttemptAt) record.last_attempt_at = details.lastAttemptAt;
    if (typeof details.lastError !== "undefined") record.last_error = details.lastError;

    await persistToAsyncStorage();
    return formatRow(record);
}

export async function markEventSynced(eventId) {
    return updateEventStatus(eventId, "SYNCED", {
        lastAttemptAt: new Date().toISOString(),
        lastError: null
    });
}

export async function markEventFailed(eventId, errorMessage) {
    return updateEventStatus(eventId, "FAILED", {
        lastAttemptAt: new Date().toISOString(),
        lastError: errorMessage || "Synchronization failed."
    });
}

export async function clearUserQueue(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    let deleted = 0;
    for (const [key, record] of memoryStore.entries()) {
        if (record.user_id === userId) {
            memoryStore.delete(key);
            deleted++;
        }
    }
    await persistToAsyncStorage();
    return deleted;
}

export async function getPendingCount(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    let count = 0;
    for (const record of memoryStore.values()) {
        if (record.user_id === userId && (record.status === "PENDING" || record.status === "SYNCING")) {
            count++;
        }
    }
    return count;
}

export async function getFailedCount(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    let count = 0;
    for (const record of memoryStore.values()) {
        if (record.user_id === userId && record.status === "FAILED") {
            count++;
        }
    }
    return count;
}

export async function retryFailedEvents(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    let updated = 0;
    const now = new Date().toISOString();
    for (const record of memoryStore.values()) {
        if (record.user_id === userId && record.status === "FAILED") {
            record.status = "PENDING";
            record.attempt_count = 0;
            record.updated_at = now;
            updated++;
        }
    }
    if (updated > 0) {
        await persistToAsyncStorage();
    }
    return updated;
}

function formatRow(row) {
    let payload = {};
    try {
        payload = JSON.parse(row.payload_json || "{}");
    } catch (_err) {
        payload = {};
    }

    return {
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        eventType: row.event_type,
        payload,
        clientTimestamp: row.client_timestamp,
        status: row.status,
        attemptCount: row.attempt_count || 0,
        lastAttemptAt: row.last_attempt_at || null,
        lastError: row.last_error || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
