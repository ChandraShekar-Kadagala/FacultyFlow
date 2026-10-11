/**
 * ============================================================
 * FacultyFlow Mobile — Synchronization Engine
 * ============================================================
 * Coordinates the reliable dispatch of queued offline attendance events
 * to the backend server with account isolation, non-overlapping mutex
 * execution, bounded retries, and idempotency recognition.
 *
 * Technical Invariants:
 * 1. Server Authoritative: Client observation times are evidence only;
 *    server acknowledges and creates authoritative MongoDB records.
 * 2. Idempotency: Duplicate acknowledgements (HTTP 200 DUPLICATE) from
 *    the backend are treated as successful syncs (`SYNCED`).
 * 3. Non-Overlapping: A global lock ensures only one sync cycle runs
 *    at any point in time.
 * 4. Account Scoping: Only events matching the current authenticated
 *    `userId` are processed.
 * 5. Bounded Retries: Events failing with transient errors are retried
 *    up to 5 times with exponential backoff before being marked FAILED.
 * 6. Session Expiry: HTTP 401 stops synchronization without discarding
 *    the offline queue, allowing recovery after re-login.
 */

import {
    getPendingEvents,
    updateEventStatus,
    markEventSynced,
    markEventFailed,
    getPendingCount,
    getFailedCount,
    retryFailedEvents,
    enqueueOfflineEvent,
    generateSyncEventId
} from "../storage/sqliteQueue.js";

import { isNetworkConnected } from "./networkMonitor.js";
import { syncAttendanceEvent } from "./syncApi.js";

const MAX_RETRIES = 5;

// In-flight mutex to prevent overlapping sync runs
let isSyncInProgress = false;

/**
 * Checks whether a synchronization cycle is currently executing.
 */
export function isSyncing() {
    return isSyncInProgress;
}

/**
 * Synchronizes all pending attendance events for a specific faculty member.
 *
 * @param {string} accessToken - Active JWT token
 * @param {string} userId - Authenticated user / faculty ID
 * @returns {Promise<Object>} Sync outcome summary
 */
export async function syncUserEvents(accessToken, userId) {
    if (!userId) {
        return {
            success: false,
            status: "NO_USER",
            message: "User ID is required for synchronization.",
            syncedCount: 0,
            failedCount: 0,
            remainingCount: 0
        };
    }

    if (!accessToken) {
        return {
            success: false,
            status: "NO_AUTH",
            message: "Authentication token is required.",
            syncedCount: 0,
            failedCount: 0,
            remainingCount: await getPendingCount(userId)
        };
    }

    // Mutex guard: synchronous acquisition to prevent async race condition before await
    if (isSyncInProgress) {
        return {
            success: false,
            status: "ALREADY_SYNCING",
            message: "A synchronization run is already in progress.",
            syncedCount: 0,
            failedCount: 0,
            remainingCount: await getPendingCount(userId)
        };
    }

    isSyncInProgress = true;

    let syncedCount = 0;
    let failedCount = 0;

    try {
        // Network check
        const connected = await isNetworkConnected();
        if (!connected) {
            return {
                success: false,
                status: "OFFLINE",
                message: "Device is offline. Queued events will synchronize when connection returns.",
                syncedCount: 0,
                failedCount: 0,
                remainingCount: await getPendingCount(userId)
            };
        }
        const pendingEvents = await getPendingEvents(userId);

        if (pendingEvents.length === 0) {
            return {
                success: true,
                status: "EMPTY",
                message: "No pending events to synchronize.",
                syncedCount: 0,
                failedCount: 0,
                remainingCount: 0
            };
        }

        for (const event of pendingEvents) {
            // Check retry limit
            if (event.attemptCount >= MAX_RETRIES) {
                await markEventFailed(
                    event.eventId,
                    `Max retry attempts (${MAX_RETRIES}) exceeded.`
                );
                failedCount++;
                continue;
            }

            const currentAttempt = (event.attemptCount || 0) + 1;
            const nowIso = new Date().toISOString();

            // Set state to SYNCING
            await updateEventStatus(event.eventId, "SYNCING", {
                attemptCount: currentAttempt,
                lastAttemptAt: nowIso
            });

            try {
                const response = await syncAttendanceEvent({
                    eventId: event.eventId,
                    eventType: event.eventType,
                    userId: event.userId,
                    facultyId: event.userId,
                    payload: event.payload,
                    clientTimestamp: event.clientTimestamp
                }, accessToken);

                // Both PROCESSED and DUPLICATE are valid server confirmations
                if (response?.success || response?.duplicate || response?.status === "DUPLICATE") {
                    await markEventSynced(event.eventId);
                    syncedCount++;
                } else {
                    throw new Error(response?.message || "Server did not acknowledge synchronization.");
                }
            } catch (err) {
                // 1. Session Expiry (401)
                if (err?.status === 401 || err?.isAuthError) {
                    // Reset status to PENDING so it can resume upon re-login
                    await updateEventStatus(event.eventId, "PENDING", {
                        lastError: "Session expired during sync. Re-authentication required."
                    });
                    return {
                        success: false,
                        status: "AUTH_EXPIRED",
                        message: "Session expired. Please log in again to complete sync.",
                        syncedCount,
                        failedCount: failedCount + 1,
                        remainingCount: await getPendingCount(userId)
                    };
                }

                // 2. Permanent Rejection (400, 403, 409 unrecoverable)
                const isPermanentFailure = [400, 403].includes(err?.status) && !err?.isNetworkError;

                if (isPermanentFailure) {
                    await markEventFailed(event.eventId, err.message || "Permanent server rejection.");
                    failedCount++;
                } else {
                    // 3. Transient Failure (network drop, timeout, 5xx)
                    const isExhausted = currentAttempt >= MAX_RETRIES;
                    const newStatus = isExhausted ? "FAILED" : "PENDING";

                    await updateEventStatus(event.eventId, newStatus, {
                        attemptCount: currentAttempt,
                        lastError: err.message || "Network error during sync."
                    });

                    failedCount++;
                }

                // Causal Ordering Safeguard:
                // If a CHECK_IN event failed to synchronize (transient or permanent),
                // do NOT attempt subsequent dependent events (e.g. CHECK_OUT) in this same cycle.
                // Keep them safely queued in PENDING until check-in resolves.
                if (event.eventType === "CHECK_IN") {
                    console.warn(`[SyncEngine] CHECK_IN event ${event.eventId} did not synchronize successfully. Halting subsequent events to preserve causal order.`);
                    break;
                }
            }
        }

        const remainingCount = await getPendingCount(userId);

        return {
            success: failedCount === 0,
            status: failedCount === 0 ? "SYNCED" : "PARTIAL_SYNC",
            message: `Synchronized ${syncedCount} event(s). ${failedCount > 0 ? `${failedCount} failed.` : ""}`,
            syncedCount,
            failedCount,
            remainingCount
        };
    } finally {
        isSyncInProgress = false;
    }
}

/**
 * Helper to queue an offline action and immediately attempt sync if online.
 */
export async function queueAndAttemptSync({
    userId,
    eventType,
    payload = {},
    accessToken
}) {
    const eventId = generateSyncEventId(userId, eventType);
    const clientTimestamp = new Date().toISOString();

    const queuedRecord = await enqueueOfflineEvent({
        eventId,
        userId,
        eventType,
        payload,
        clientTimestamp
    });

    const isConnected = await isNetworkConnected();

    if (!isConnected || !accessToken) {
        return {
            success: true,
            status: "QUEUED_OFFLINE",
            eventId,
            queuedRecord,
            synced: false
        };
    }

    // Try immediate background sync
    const syncResult = await syncUserEvents(accessToken, userId);

    return {
        success: true,
        status: syncResult.syncedCount > 0 ? "SYNCED" : "QUEUED_OFFLINE",
        eventId,
        queuedRecord,
        synced: syncResult.syncedCount > 0,
        syncResult
    };
}

/**
 * Backward compatibility exports
 */
export const syncPendingEvents = (accessToken, userId) => syncUserEvents(accessToken, userId);
export const createAttendanceEvent = ({ eventType, facultyId, payload }) => ({
    eventId: generateSyncEventId(facultyId, eventType),
    eventType,
    facultyId,
    payload
});

export { getFailedCount, retryFailedEvents };

export default {
    syncUserEvents,
    queueAndAttemptSync,
    isSyncing,
    syncPendingEvents,
    getFailedCount,
    retryFailedEvents
};