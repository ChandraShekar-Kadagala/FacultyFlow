import {
    SYNC_STATUS,
    SYNC_CONFIG
} from "./syncConstants";

import {
    getRetryableEvents,
    updateSyncEvent
} from "./syncStorage";


function calculateRetryDelay(
    retryCount
) {
    const index =
        Math.min(
            retryCount,
            SYNC_CONFIG.RETRY_DELAYS.length - 1
        );

    return SYNC_CONFIG.RETRY_DELAYS[index];
}


function canRetry(event) {

    const retryCount =
        event.retryCount || 0;

    return (
        retryCount <
        SYNC_CONFIG.MAX_RETRIES
    );
}


function markSyncing(event) {

    return updateSyncEvent(
        event.eventId,
        {
            status: SYNC_STATUS.SYNCING,

            lastAttemptAt:
                new Date().toISOString()
        }
    );
}


function markRetryFailure(
    event,
    error
) {

    const nextRetryCount =
        (event.retryCount || 0) + 1;

    const exhausted =
        nextRetryCount >=
        SYNC_CONFIG.MAX_RETRIES;

    const retryDelay =
        calculateRetryDelay(
            nextRetryCount - 1
        );

    return updateSyncEvent(
        event.eventId,
        {
            status:
                exhausted
                    ? SYNC_STATUS.FAILED
                    : SYNC_STATUS.PENDING,

            retryCount:
                nextRetryCount,

            lastError:
                error?.message ||
                "Unknown sync error",

            nextRetryAt:
                exhausted
                    ? null
                    : new Date(
                        Date.now() +
                        retryDelay
                    ).toISOString(),

            lastAttemptAt:
                new Date().toISOString()
        }
    );
}


export async function retrySyncEvent(
    event,
    syncFunction
) {

    if (!event?.eventId) {

        throw new Error(
            "Event ID is required"
        );
    }


    if (
        typeof syncFunction !==
        "function"
    ) {

        throw new Error(
            "syncFunction must be a function"
        );
    }


    if (!canRetry(event)) {

        return {
            success: false,
            skipped: true,
            reason:
                "MAX_RETRIES_REACHED"
        };
    }


    markSyncing(event);


    try {

        const result =
            await syncFunction(event);


        updateSyncEvent(
            event.eventId,
            {
                status:
                    SYNC_STATUS.SYNCED,

                syncedAt:
                    new Date().toISOString(),

                lastError:
                    null
            }
        );


        return {
            success: true,
            skipped: false,
            result
        };


    } catch (error) {

        markRetryFailure(
            event,
            error
        );


        return {
            success: false,
            skipped: false,
            error
        };
    }
}


export async function retryPendingEvents(
    syncFunction
) {

    const events =
        getRetryableEvents();


    const results = [];


    for (const event of events) {

        const result =
            await retrySyncEvent(
                event,
                syncFunction
            );


        results.push({
            eventId:
                event.eventId,

            ...result
        });
    }


    return results;
}