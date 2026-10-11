import {
    processSyncEvent
} from "../services/sync/syncService.js";

import {
    recordSyncAttempt,
    recordSyncSuccess,
    recordSyncFailure
} from "../services/audit/auditService.js";


// ============================================================
// POST /api/sync/events
// ============================================================

export async function syncEventController(
    req,
    res,
    next
) {
    try {
        const user = req.user;
        const isBatch = Array.isArray(req.body?.events);
        const events = isBatch ? req.body.events : [req.body];

        if (events.length === 0) {
            return res.status(400).json({
                success: false,
                code: "SYNC_EVENTS_EMPTY",
                message: "No sync events provided."
            });
        }

        const results = [];

        for (const event of events) {
            const eventId = event?.eventId || event?.syncEventId;
            const eventType = event?.eventType || event?.type;
            const normalizedEvent = {
                ...event,
                eventId,
                eventType
            };

            await recordSyncAttempt({
                actorId: user.userId,
                actorRole: user.role,
                eventId: normalizedEvent.eventId,
                metadata: { eventType: normalizedEvent.eventType }
            });

            try {
                const result = await processSyncEvent({
                    event: normalizedEvent,
                    user
                });

                if (result.duplicate) {
                    await recordSyncSuccess({
                        actorId: user.userId,
                        actorRole: user.role,
                        eventId: normalizedEvent.eventId,
                        metadata: { duplicate: true }
                    });

                    results.push({
                        status: "DUPLICATE",
                        code: result.code,
                        message: result.message,
                        eventId: normalizedEvent.eventId,
                        attendanceId: result.attendanceId || null
                    });
                } else {
                    await recordSyncSuccess({
                        actorId: user.userId,
                        actorRole: user.role,
                        eventId: normalizedEvent.eventId,
                        metadata: { duplicate: false, attendanceId: result.attendance?.attendanceId }
                    });

                    results.push({
                        status: "PROCESSED",
                        code: result.code,
                        message: result.message,
                        eventId: normalizedEvent.eventId,
                        attendance: result.attendance,
                        verification: result.verification,
                        policy: result.policy
                    });
                }
            } catch (eventErr) {
                if (normalizedEvent.eventId) {
                    await recordSyncFailure({
                        actorId: user.userId,
                        actorRole: user.role,
                        eventId: normalizedEvent.eventId,
                        reason: eventErr.message
                    });
                }
                if (!isBatch) {
                    throw eventErr;
                }
                results.push({
                    status: "FAILED",
                    code: eventErr.code || "SYNC_ERROR",
                    message: eventErr.message,
                    eventId: normalizedEvent.eventId
                });
            }
        }

        if (isBatch) {
            return res.status(200).json({
                success: true,
                count: results.length,
                results
            });
        }

        const singleResult = results[0];
        return res.status(200).json({
            success: true,
            duplicate: singleResult.status === "DUPLICATE",
            code: singleResult.code,
            message: singleResult.message,
            eventId: singleResult.eventId,
            attendance: singleResult.attendance,
            verification: singleResult.verification,
            policy: singleResult.policy,
            results
        });

    } catch (error) {
        next(error);
    }
}