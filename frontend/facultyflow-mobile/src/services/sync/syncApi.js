import { apiRequest } from "../api/apiClient.js";

/**
 * ============================================================
 * FacultyFlow Mobile — Synchronize Attendance Event API
 * ============================================================
 * Sends offline-recorded attendance event(s) to authoritative backend
 * endpoint `POST /api/sync/events`.
 *
 * Transmits environmental observations (device, location, network)
 * alongside stable `eventId` for server-side verification and
 * deduplication.
 */

export async function syncAttendanceEvent(event, accessToken) {
    if (!accessToken) {
        const authErr = new Error("Authentication session is missing.");
        authErr.code = "AUTH_REQUIRED";
        authErr.status = 401;
        throw authErr;
    }

    if (!event?.eventId) {
        throw new Error("Event ID is required for synchronization.");
    }

    const payload = {
        eventId: event.eventId,
        eventType: event.eventType,
        facultyId: event.facultyId || event.userId,
        device: event.device || event.payload?.device || null,
        location: event.location || event.payload?.location || null,
        network: event.network || event.payload?.network || null,
        createdAt: event.clientTimestamp || event.createdAt || new Date().toISOString()
    };

    return apiRequest("/sync/events", {
        method: "POST",
        accessToken,
        body: payload
    });
}

/**
 * Sends a batch of events to `POST /api/sync/events`.
 */
export async function syncBatchEvents(events, accessToken) {
    if (!accessToken) {
        const authErr = new Error("Authentication session is missing.");
        authErr.code = "AUTH_REQUIRED";
        authErr.status = 401;
        throw authErr;
    }

    if (!Array.isArray(events) || events.length === 0) {
        return { success: true, count: 0, results: [] };
    }

    const normalizedEvents = events.map((event) => ({
        eventId: event.eventId,
        eventType: event.eventType,
        facultyId: event.facultyId || event.userId,
        device: event.device || event.payload?.device || null,
        location: event.location || event.payload?.location || null,
        network: event.network || event.payload?.network || null,
        createdAt: event.clientTimestamp || event.createdAt || new Date().toISOString()
    }));

    return apiRequest("/sync/events", {
        method: "POST",
        accessToken,
        body: { events: normalizedEvents }
    });
}

export default {
    syncAttendanceEvent,
    syncBatchEvents
};