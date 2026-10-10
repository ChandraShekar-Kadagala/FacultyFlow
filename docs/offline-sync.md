# Offline Synchronization

A core feature of the mobile application is its ability to operate in unstable network environments using an offline-first event synchronization queue.

## Event Lifecycle

1. **Local Queueing**: When a user attempts to check in while offline, the mobile client assigns a cryptographically unique `eventId`, stores the attempt in local `AsyncStorage`, and flags it as `PENDING_SYNC`.
2. **Sync Orchestrator**: A background hook (`useAutoSync`) monitors connectivity and dispatches the queue to the backend once online.
3. **Server Processing**: The server receives the event list via `/api/sync` and processes it sequentially.

## Idempotency and Recovery Guarantee

Mobile network drops are frequent, causing a scenario where the client sends the data, the server successfully processes it, but the client never receives the network acknowledgment. The client will inevitably retry the event.

To safely solve this, FacultyFlow guarantees **exactly-once processing**:
- Every inbound sync event is inserted into the `SyncEvent` collection on the server.
- The `SyncEvent` acts as an idempotency lock.
- The `syncEventId` is stored aggressively on the final outcome record (`AttendanceRecord`).
- **Interrupted Recovery**: If a server crashes mid-processing, an event may be stuck in the `RECEIVED` state. When the client retries the event, the server explicitly queries the `AttendanceRecord` collection to verify if `syncEventId` exists. If it does, the server recovers the outcome gracefully without generating a duplicate `CheckIn`.

## Failure Diagnosis

- **Temporary Failures (5xx, Network loss)**: The event status remains `PENDING_SYNC` and is continually retried.
- **Permanent Rejections (400, Invalid Payload)**: The event is marked `SYNC_FAILED` and is either discarded or held for manual inspection, preserving the sync queue flow for subsequent valid events.
