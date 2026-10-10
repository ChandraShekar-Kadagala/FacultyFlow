import NetInfo
    from "@react-native-community/netinfo";


import {
    addAttendanceEvent,
    getPendingEvents,
    updatePendingEvent
} from "./storageService";


import {
    enqueueEvent,
    removeFromQueue,
    markRetry
} from "./syncQueue";


import {
    syncAttendanceEvent
} from "./syncApi";


// ============================================================
// CREATE UNIQUE EVENT ID
// ============================================================

function createEventId() {

    return (
        "evt_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


// ============================================================
// CREATE ATTENDANCE EVENT
// ============================================================

export function createAttendanceEvent({

    eventType,

    facultyId,

    attendance,

    verification

}) {

    return {

        eventId:
            createEventId(),

        eventType,

        facultyId,

        attendance,

        verification,

        createdAt:
            new Date().toISOString(),

        syncStatus:
            "LOCAL",

        retryCount:
            0,

        lastSyncAttempt:
            null,

        lastSyncError:
            null

    };

}


// ============================================================
// SAVE ATTENDANCE LOCALLY
// ============================================================

export async function saveLocalAttendance(
    event
) {

    return addAttendanceEvent(
        event
    );

}


// ============================================================
// SYNC ONE EVENT
// ============================================================

export async function syncSingleEvent(
    event,
    accessToken
) {

    try {

        // ----------------------------------------------------
        // Authentication is required for server sync
        // ----------------------------------------------------

        if (!accessToken) {

            throw new Error(
                "Authentication session is missing."
            );

        }


        // ----------------------------------------------------
        // Mark event as syncing
        // ----------------------------------------------------

        await updatePendingEvent(

            event.eventId,

            {

                syncStatus:
                    "SYNCING",

                lastSyncAttempt:
                    new Date().toISOString(),

                lastSyncError:
                    null

            }

        );


        // ----------------------------------------------------
        // Send event to authenticated backend
        // ----------------------------------------------------

        const result =
            await syncAttendanceEvent(

                event,

                accessToken

            );


        // ----------------------------------------------------
        // Server accepted event
        // Remove it from pending queue
        // ----------------------------------------------------

        await removeFromQueue(

            event.eventId

        );


        return {

            success:
                true,

            status:
                "SYNCED",

            eventId:
                event.eventId,

            result

        };

    } catch (error) {

        // ----------------------------------------------------
        // Keep event in queue
        // Retry later
        // ----------------------------------------------------

        await markRetry(

            event.eventId,

            error.message

        );


        return {

            success:
                false,

            status:
                "PENDING_SYNC",

            eventId:
                event.eventId,

            error:
                error.message

        };

    }

}


// ============================================================
// SAVE LOCALLY + ATTEMPT SYNC
// ============================================================

export async function saveAndSync(

    event,

    accessToken

) {

    // ========================================================
    // STEP 1
    // Persist attendance locally
    // ========================================================

    await saveLocalAttendance(
        event
    );


    // ========================================================
    // STEP 2
    // Put event into pending queue
    //
    // IMPORTANT:
    // Queue BEFORE network request.
    // ========================================================

    await enqueueEvent(
        event
    );


    // ========================================================
    // STEP 3
    // Check network connectivity
    // ========================================================

    const network =
        await NetInfo.fetch();


    if (!network.isConnected) {

        return {

            success:
                true,

            status:
                "PENDING_SYNC",

            eventId:
                event.eventId,

            reason:
                "Device is offline"

        };

    }


    // ========================================================
    // STEP 4
    // Try authenticated synchronization
    // ========================================================

    return syncSingleEvent(

        event,

        accessToken

    );

}


// ============================================================
// SYNC ALL PENDING EVENTS
// ============================================================

export async function syncPendingEvents(

    accessToken

) {

    // ========================================================
    // AUTHENTICATION CHECK
    // ========================================================

    if (!accessToken) {

        return {

            success:
                false,

            status:
                "AUTHENTICATION_REQUIRED",

            synced:
                0,

            failed:
                0

        };

    }


    // ========================================================
    // CHECK NETWORK
    // ========================================================

    const network =
        await NetInfo.fetch();


    if (!network.isConnected) {

        return {

            success:
                false,

            status:
                "OFFLINE",

            synced:
                0,

            failed:
                0

        };

    }


    // ========================================================
    // LOAD PENDING EVENTS
    // ========================================================

    const pendingEvents =
        await getPendingEvents();


    if (
        pendingEvents.length === 0
    ) {

        return {

            success:
                true,

            status:
                "SYNCED",

            synced:
                0,

            failed:
                0

        };

    }


    // ========================================================
    // PROCESS EVENTS SEQUENTIALLY
    // ========================================================

    let synced = 0;

    let failed = 0;


    for (
        const event
        of pendingEvents
    ) {

        const result =
            await syncSingleEvent(

                event,

                accessToken

            );


        if (
            result.success
        ) {

            synced++;

        } else {

            failed++;

        }

    }


    // ========================================================
    // FINAL RESULT
    // ========================================================

    return {

        success:
            failed === 0,

        status:
            failed === 0

                ? "SYNCED"

                : "PARTIAL_SYNC",

        synced,

        failed

    };

}