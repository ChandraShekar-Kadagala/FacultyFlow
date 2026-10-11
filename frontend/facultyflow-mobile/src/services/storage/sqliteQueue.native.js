/**
 * ============================================================
 * FacultyFlow Mobile — Native SQLite Offline Queue Service
 * ============================================================
 * Hardware-persisted, relational ACID offline queue using `expo-sqlite`
 * on native Android and iOS devices.
 */

import * as SQLite from "expo-sqlite";

let databaseInstance = null;
let isInitialized = false;

export async function initQueueDatabase() {
    if (isInitialized && databaseInstance) return true;

    try {
        databaseInstance = await SQLite.openDatabaseAsync("facultyflow_offline.db");
        await databaseInstance.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS schema_versions (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS offline_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                client_timestamp TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                attempt_count INTEGER DEFAULT 0,
                last_attempt_at TEXT,
                last_error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_offline_user_status ON offline_events(user_id, status);
        `);

        await databaseInstance.runAsync(`
            INSERT OR IGNORE INTO schema_versions (version, applied_at)
            VALUES (1, datetime('now'))
        `);

        isInitialized = true;
        return true;
    } catch (err) {
        console.error("Failed to initialize native SQLite queue:", err);
        throw err;
    }
}

export async function getSchemaVersion() {
    await initQueueDatabase();
    const row = await databaseInstance.getFirstAsync(`SELECT MAX(version) as version FROM schema_versions`);
    return row?.version || 1;
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
    if (!eventId) throw new Error("eventId is required.");
    if (!userId) throw new Error("userId is required.");
    if (!eventType || !["CHECK_IN", "CHECK_OUT"].includes(eventType)) {
        throw new Error("Invalid eventType. Must be 'CHECK_IN' or 'CHECK_OUT'.");
    }

    await initQueueDatabase();

    const timestamp = clientTimestamp || new Date().toISOString();
    const payloadStr = JSON.stringify(payload);
    const now = new Date().toISOString();

    const result = await databaseInstance.runAsync(
        `INSERT INTO offline_events 
         (event_id, user_id, event_type, payload_json, client_timestamp, status, attempt_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
        [eventId, userId, eventType, payloadStr, timestamp, now, now]
    );

    return {
        id: result.lastInsertRowId,
        eventId,
        userId,
        eventType,
        payload,
        clientTimestamp: timestamp,
        status: "PENDING",
        attemptCount: 0,
        createdAt: now,
        updatedAt: now
    };
}

export async function getPendingEvents(userId) {
    if (!userId) throw new Error("userId is required.");
    await initQueueDatabase();

    const rows = await databaseInstance.getAllAsync(
        `SELECT * FROM offline_events 
         WHERE user_id = ? AND status IN ('PENDING', 'SYNCING')
         ORDER BY id ASC`,
        [userId]
    );

    return rows.map(formatRow);
}

export async function getAllEventsForUser(userId) {
    if (!userId) throw new Error("userId is required.");
    await initQueueDatabase();

    const rows = await databaseInstance.getAllAsync(
        `SELECT * FROM offline_events WHERE user_id = ? ORDER BY id DESC`,
        [userId]
    );
    return rows.map(formatRow);
}

export async function getEventById(eventId) {
    if (!eventId) return null;
    await initQueueDatabase();

    const row = await databaseInstance.getFirstAsync(
        `SELECT * FROM offline_events WHERE event_id = ?`,
        [eventId]
    );
    return row ? formatRow(row) : null;
}

export async function updateEventStatus(eventId, status, details = {}) {
    if (!eventId) throw new Error("eventId is required.");
    if (!status) throw new Error("status is required.");
    await initQueueDatabase();

    const now = new Date().toISOString();
    const sets = ["status = ?", "updated_at = ?"];
    const params = [status, now];

    if (typeof details.attemptCount === "number") {
        sets.push("attempt_count = ?");
        params.push(details.attemptCount);
    }
    if (details.lastAttemptAt) {
        sets.push("last_attempt_at = ?");
        params.push(details.lastAttemptAt);
    }
    if (typeof details.lastError !== "undefined") {
        sets.push("last_error = ?");
        params.push(details.lastError);
    }

    params.push(eventId);
    await databaseInstance.runAsync(
        `UPDATE offline_events SET ${sets.join(", ")} WHERE event_id = ?`,
        params
    );
    return getEventById(eventId);
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

    const result = await databaseInstance.runAsync(
        `DELETE FROM offline_events WHERE user_id = ?`,
        [userId]
    );
    return result.changes;
}

export async function getPendingCount(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    const result = await databaseInstance.getFirstAsync(
        `SELECT COUNT(*) as count FROM offline_events WHERE user_id = ? AND status IN ('PENDING', 'SYNCING')`,
        [userId]
    );
    return result?.count || 0;
}

export async function getFailedCount(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    const result = await databaseInstance.getFirstAsync(
        `SELECT COUNT(*) as count FROM offline_events WHERE user_id = ? AND status = 'FAILED'`,
        [userId]
    );
    return result?.count || 0;
}

export async function retryFailedEvents(userId) {
    if (!userId) return 0;
    await initQueueDatabase();

    const now = new Date().toISOString();
    const result = await databaseInstance.runAsync(
        `UPDATE offline_events SET status = 'PENDING', attempt_count = 0, updated_at = ? WHERE user_id = ? AND status = 'FAILED'`,
        [now, userId]
    );
    return result.changes;
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
