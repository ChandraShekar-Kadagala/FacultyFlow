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

        // ----------------------------------------------------
        // Authentication middleware has already populated
        // req.user.
        // ----------------------------------------------------

        const user =
            req.user;


        const event = req.body;

        await recordSyncAttempt({
            actorId: user.userId,
            actorRole: user.role,
            eventId: event.eventId,
            metadata: { eventType: event.eventType }
        });

        const result =
            await processSyncEvent({
                event,
                user
            });

        // ----------------------------------------------------
        // Duplicate event
        // ----------------------------------------------------

        if (result.duplicate) {
            await recordSyncSuccess({
                actorId: user.userId,
                actorRole: user.role,
                eventId: event.eventId,
                metadata: { duplicate: true }
            });

            return res
                .status(200)
                .json({
                    success: true,
                    duplicate: true,
                    code: result.code,
                    message: result.message,
                    eventId: event.eventId,
                    attendanceId: result.attendanceId || null
                });
        }

        // ----------------------------------------------------
        // Successfully processed
        // ----------------------------------------------------

        await recordSyncSuccess({
            actorId: user.userId,
            actorRole: user.role,
            eventId: event.eventId,
            metadata: { duplicate: false, attendanceId: result.attendance?.attendanceId }
        });

        return res
            .status(200)
            .json({
                success: true,
                duplicate: false,
                code: result.code,
                message: result.message,
                eventId: event.eventId,
                attendance: result.attendance,
                verification: result.verification,
                policy: result.policy
            });

    } catch (error) {
        if (req.body?.eventId) {
            await recordSyncFailure({
                actorId: req.user.userId,
                actorRole: req.user.role,
                eventId: req.body.eventId,
                reason: error.message
            });
        }
        next(error);
    }

}