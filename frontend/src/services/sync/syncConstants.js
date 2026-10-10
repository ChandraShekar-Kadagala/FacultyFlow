export const SYNC_STATUS = {
    PENDING: "PENDING_SYNC",
    SYNCING: "SYNCING",
    SYNCED: "SYNCED",
    FAILED: "SYNC_FAILED"
};


export const SYNC_STORAGE_KEY =
    "facultyflow_sync_queue";


export const SYNC_SCHEMA_VERSION = 1;


export const SYNC_RESULT = {
    NEW: "NEW",
    DUPLICATE: "DUPLICATE",
    NOT_FOUND: "NOT_FOUND"
};


export const SYNC_CONFIG = {
    MAX_RETRIES: 5,

    RETRY_DELAYS: [
        5000,
        15000,
        30000,
        60000,
        120000
    ]
};