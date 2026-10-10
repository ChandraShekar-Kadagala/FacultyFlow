import {
    addToSyncQueue,
    getSyncQueue,
    getPendingSyncEvents,
    getSyncEventById,
    updateSyncEvent,
    removeSyncEvent,
    clearSyncQueue
} from "./syncStorage";

import {
    SYNC_STATUS
} from "./syncConstants";


clearSyncQueue();


const testEvent = {
    eventId: "TEST-EVENT-001",

    eventType: "CHECK_IN",

    facultyId: "F101",

    payload: {
        attendanceId: "ATT-001"
    },

    status: SYNC_STATUS.PENDING,

    createdAt: new Date().toISOString(),

    retryCount: 0
};


console.log(
    "Adding event:",
    addToSyncQueue(testEvent)
);


console.log(
    "Complete queue:",
    getSyncQueue()
);


console.log(
    "Pending events:",
    getPendingSyncEvents()
);


console.log(
    "Find event:",
    getSyncEventById(
        "TEST-EVENT-001"
    )
);


console.log(
    "Updating event:",
    updateSyncEvent(
        "TEST-EVENT-001",
        {
            status: SYNC_STATUS.SYNCING
        }
    )
);


console.log(
    "After update:",
    getSyncEventById(
        "TEST-EVENT-001"
    )
);


console.log(
    "Removing event:",
    removeSyncEvent(
        "TEST-EVENT-001"
    )
);


console.log(
    "Final queue:",
    getSyncQueue()
);