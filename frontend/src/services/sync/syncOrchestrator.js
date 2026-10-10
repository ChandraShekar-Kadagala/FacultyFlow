import {
    getRetryableEvents,
    getSyncQueueSize
} from "./syncStorage";


import {
    retrySyncEvent
} from "./retryEngine";


import {
    isOnline
} from "./connectivityService";


import {
    recordSyncSuccess,
    recordSyncFailure
} from "../audit/auditService";


export async function syncPendingEvents(
    syncFunction
) {

    if (
        typeof syncFunction !==
        "function"
    ) {

        throw new Error(
            "syncFunction must be a function"
        );
    }


    if (!isOnline()) {

        return {

            success: false,

            skipped: true,

            reason:
                "OFFLINE",

            syncedCount: 0,

            failedCount: 0
        };
    }


    const events =
        getRetryableEvents();


    if (events.length === 0) {

        return {

            success: true,

            skipped: true,

            reason:
                "NO_PENDING_EVENTS",

            syncedCount: 0,

            failedCount: 0
        };
    }


    let syncedCount = 0;

    let failedCount = 0;


    for (
        const event of events
    ) {

        const result =
            await retrySyncEvent(
                event,
                syncFunction
            );


        if (result.success) {

            recordSyncSuccess(
                event
            );

            syncedCount++;

        } else if (
            !result.skipped
        ) {

            recordSyncFailure(
                event,
                result.error
            );

            failedCount++;
        }
    }


    return {

        success:
            failedCount === 0,

        skipped: false,

        reason:
            "SYNC_COMPLETED",

        syncedCount,

        failedCount,

        remainingEvents:
            getSyncQueueSize()
    };
}