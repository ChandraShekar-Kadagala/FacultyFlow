/**
 * ============================================================
 * FacultyFlow Phase 3: Offline Attendance Synchronization Gateway
 * ============================================================
 * Automated regression suite verifying the durable offline event queue,
 * connectivity monitoring, sync engine dispatch, server idempotency,
 * and account isolation.
 *
 * Verified Gates:
 * 1. SQLite Queue Schema & CRUD Operations
 * 2. Account Isolation Verification (Multi-user queue scoping)
 * 3. Connectivity State Monitoring & Mock Network Transitions
 * 4. Offline Check-In Enqueue & Authoritative Server Synchronization
 * 5. Server Idempotency & Duplicate Event Deduplication
 * 6. Offline Check-Out Enqueue & Sequential Synchronization
 * 7. Bounded Retries, Error Tracking & Session Expiry Guard
 */

import fs from "fs";
import path from "path";

// Load backend .env directly
const envPath = path.resolve("../../backend/.env");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
                process.env[key] = val;
            }
        }
    }
}
process.env.EXPO_PUBLIC_API_URL = "http://localhost:5000/api";

const { loginUser } = await import("./src/services/auth/authService.js");
const {
    initQueueDatabase,
    enqueueOfflineEvent,
    getPendingEvents,
    getAllEventsForUser,
    getEventById,
    updateEventStatus,
    markEventSynced,
    markEventFailed,
    clearUserQueue,
    getPendingCount,
    generateSyncEventId
} = await import("./src/services/storage/sqliteQueue.js");

const {
    isNetworkConnected,
    subscribeNetworkStatus,
    setMockNetworkStatus
} = await import("./src/services/sync/networkMonitor.js");

const {
    syncAttendanceEvent
} = await import("./src/services/sync/syncApi.js");

const {
    syncUserEvents,
    isSyncing,
    queueAndAttemptSync
} = await import("./src/services/sync/syncEngine.js");

const results = [];
function record(gate, title, status, details = "") {
    results.push({ gate, title, status, details });
    const icon = status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${status}] Phase 3 Gate ${gate}: ${title}`);
    if (details) console.log(`   Details: ${details}`);
}

async function runMobilePhase3Tests() {
    console.log("====================================================");
    console.log("  FACULTYFLOW PHASE 3: OFFLINE SYNC GATEWAY VERIFY  ");
    console.log("====================================================\n");

    const mongooseMod = (await import("../../backend/node_modules/mongoose/index.js")).default;
    await mongooseMod.connect(process.env.MONGO_URI);

    const User = (await import("../../backend/src/models/User.js")).default;
    const Faculty = (await import("../../backend/src/models/Faculty.js")).default;
    const AttendanceRecord = (await import("../../backend/src/models/AttendanceRecord.js")).default;
    const VerificationEvent = (await import("../../backend/src/models/VerificationEvent.js")).default;
    const SyncEvent = (await import("../../backend/src/models/SyncEvent.js")).default;
    const AttendancePolicy = (await import("../../backend/src/models/AttendancePolicy.js")).default;
    const CampusLocation = (await import("../../backend/src/models/CampusLocation.js")).default;
    const { hashPassword } = await import("../../backend/src/services/auth/passwordService.js");

    const email = "mobile_p3_faculty@test.com";
    const password = "Phase3Password123!";
    const facultyId = "FAC-P3-01";
    const userId = "USR-P3-01";

    const emailAlt = "mobile_p3_alt@test.com";
    const facultyIdAlt = "FAC-P3-02";
    const userIdAlt = "USR-P3-02";

    // Clean prior test records
    await User.deleteMany({ email: { $in: [email, emailAlt] } });
    await Faculty.deleteMany({ facultyId: { $in: [facultyId, facultyIdAlt] } });
    await AttendanceRecord.deleteMany({ facultyId: { $in: [facultyId, facultyIdAlt] } });
    await VerificationEvent.deleteMany({ facultyId: { $in: [facultyId, facultyIdAlt] } });
    await SyncEvent.deleteMany({ facultyId: { $in: [facultyId, facultyIdAlt] } });

    // Ensure single active open test policy
    await AttendancePolicy.updateMany({}, { active: false });
    await AttendancePolicy.deleteMany({ policyId: "POL-P3-TEST" });
    await AttendancePolicy.findOneAndUpdate(
        { policyId: "POL-TEST" },
        {
            policyId: "POL-TEST",
            startTime: "00:00",
            endTime: "23:59",
            gracePeriod: 30,
            lateThreshold: 60,
            earlyExitThreshold: 60,
            requiredSignals: [],
            active: true
        },
        { upsert: true, new: true }
    );

    // Ensure active test campus location at (0, 0)
    await CampusLocation.deleteMany({ locationId: "LOC-P3-TEST" });
    await CampusLocation.findOneAndUpdate(
        { locationId: "LOC-TEST" },
        {
            locationId: "LOC-TEST",
            name: "Phase 3 Test Campus",
            latitude: 0,
            longitude: 0,
            radiusMeters: 1000,
            status: "ACTIVE"
        },
        { upsert: true, new: true }
    );

    const passwordHash = await hashPassword(password);

    // Create primary test faculty
    await Faculty.create({
        facultyId,
        userId,
        employeeCode: "EMP-P3-01",
        name: "Dr. Offline Sync Tester",
        department: "Computer Science",
        designation: "Professor",
        status: "active"
    });

    await User.create({
        userId,
        name: "Dr. Offline Sync Tester",
        email,
        passwordHash,
        role: "faculty",
        facultyId,
        status: "active"
    });

    // Create second faculty for account isolation tests
    await Faculty.create({
        facultyId: facultyIdAlt,
        userId: userIdAlt,
        employeeCode: "EMP-P3-02",
        name: "Dr. Alternate Tester",
        department: "Electrical Engineering",
        designation: "Assistant Professor",
        status: "active"
    });

    await User.create({
        userId: userIdAlt,
        name: "Dr. Alternate Tester",
        email: emailAlt,
        passwordHash,
        role: "faculty",
        facultyId: facultyIdAlt,
        status: "active"
    });

    // Authenticate test faculty
    const loginRes = await loginUser({ email, password });
    const accessToken = loginRes.accessToken;
    if (!accessToken) throw new Error("Failed to authenticate test faculty.");

    // ========================================================
    // GATE 1: SQLite Queue Schema & CRUD Integrity
    // ========================================================
    try {
        await initQueueDatabase();
        await clearUserQueue("TEST-USER-CRUD");

        const testEventId = "TEST-EVENT-CRUD-001";
        const enqueued = await enqueueOfflineEvent({
            eventId: testEventId,
            userId: "TEST-USER-CRUD",
            eventType: "CHECK_IN",
            payload: { device: { platform: "android" }, location: { latitude: 0, longitude: 0 } },
            clientTimestamp: new Date().toISOString()
        });

        if (!enqueued || enqueued.status !== "PENDING") {
            throw new Error(`Expected PENDING status, received: ${enqueued?.status}`);
        }

        const retrieved = await getEventById(testEventId);
        if (!retrieved || retrieved.eventId !== testEventId || retrieved.eventType !== "CHECK_IN") {
            throw new Error("Failed to retrieve enqueued event by ID.");
        }

        await updateEventStatus(testEventId, "SYNCING", { attemptCount: 1 });
        const syncingEvent = await getEventById(testEventId);
        if (syncingEvent.status !== "SYNCING" || syncingEvent.attemptCount !== 1) {
            throw new Error("Failed to update status to SYNCING with attemptCount.");
        }

        await markEventSynced(testEventId);
        const syncedEvent = await getEventById(testEventId);
        if (syncedEvent.status !== "SYNCED") {
            throw new Error("Failed to mark event as SYNCED.");
        }

        await clearUserQueue("TEST-USER-CRUD");
        const remaining = await getPendingCount("TEST-USER-CRUD");
        if (remaining !== 0) throw new Error("Expected 0 remaining events after clearing queue.");

        record(1, "SQLite Queue Schema & CRUD Operations", "PASS",
            `Schema initialized, enqueued event '${testEventId}', transitioned PENDING -> SYNCING -> SYNCED cleanly.`);
    } catch (err) {
        record(1, "SQLite Queue Schema & CRUD Operations", "FAIL", err.message);
    }

    // ========================================================
    // GATE 2: Account Isolation Verification
    // ========================================================
    try {
        const userA = "FACULTY-ALPHA";
        const userB = "FACULTY-BETA";
        await clearUserQueue(userA);
        await clearUserQueue(userB);

        await enqueueOfflineEvent({
            eventId: "EVT-ALPHA-1",
            userId: userA,
            eventType: "CHECK_IN",
            payload: { note: "User A Event 1" }
        });
        await enqueueOfflineEvent({
            eventId: "EVT-ALPHA-2",
            userId: userA,
            eventType: "CHECK_OUT",
            payload: { note: "User A Event 2" }
        });

        await enqueueOfflineEvent({
            eventId: "EVT-BETA-1",
            userId: userB,
            eventType: "CHECK_IN",
            payload: { note: "User B Event 1" }
        });

        const pendingA = await getPendingEvents(userA);
        const pendingB = await getPendingEvents(userB);

        if (pendingA.length !== 2 || pendingB.length !== 1) {
            throw new Error(`Expected 2 events for userA and 1 for userB. Got A=${pendingA.length}, B=${pendingB.length}`);
        }

        const aHasBEvent = pendingA.some(e => e.userId === userB);
        const bHasAEvent = pendingB.some(e => e.userId === userA);
        if (aHasBEvent || bHasAEvent) {
            throw new Error("Cross-user event leakage detected in SQLite queries.");
        }

        // Clear user A's queue and verify user B's queue is unaffected
        await clearUserQueue(userA);
        const remainingA = await getPendingCount(userA);
        const remainingB = await getPendingCount(userB);

        if (remainingA !== 0 || remainingB !== 1) {
            throw new Error(`Account wipe contaminated another user's queue. A=${remainingA}, B=${remainingB}`);
        }

        await clearUserQueue(userB);
        record(2, "Account Isolation Verification (Multi-user queue scoping)", "PASS",
            `User A (2 events) and User B (1 event) maintained strict queue separation; clearUserQueue isolated cleanly.`);
    } catch (err) {
        record(2, "Account Isolation Verification (Multi-user queue scoping)", "FAIL", err.message);
    }

    // ========================================================
    // GATE 3: Connectivity State Monitoring & Mock Transitions
    // ========================================================
    try {
        let detectedOnline = null;
        const unsubscribe = subscribeNetworkStatus((status) => {
            detectedOnline = status;
        });

        // 1. Simulate network drop
        setMockNetworkStatus(false);
        const isOffline = await isNetworkConnected();
        if (isOffline !== false || detectedOnline !== false) {
            throw new Error("Failed to observe simulated offline state drop.");
        }

        // 2. Simulate network restoration
        setMockNetworkStatus(true);
        const isOnline = await isNetworkConnected();
        if (isOnline !== true || detectedOnline !== true) {
            throw new Error("Failed to observe simulated online state restoration.");
        }

        unsubscribe();
        setMockNetworkStatus(null); // Reset mock

        record(3, "Connectivity State Monitoring & Mock Network Transitions", "PASS",
            "Network listeners observed offline (false) and online (true) transitions reliably.");
    } catch (err) {
        setMockNetworkStatus(null);
        record(3, "Connectivity State Monitoring & Mock Network Transitions", "FAIL", err.message);
    }

    // ========================================================
    // GATE 4: Offline Check-In Enqueue & Server Sync Dispatch
    // ========================================================
    const checkInEventId = generateSyncEventId(facultyId, "CHECK_IN");
    try {
        await clearUserQueue(facultyId);

        // Enqueue offline check-in while simulating offline condition
        const offlineRecord = await enqueueOfflineEvent({
            eventId: checkInEventId,
            userId: facultyId,
            eventType: "CHECK_IN",
            payload: {
                device: { platform: "android", model: "Pixel 8" },
                location: { latitude: 0, longitude: 0, accuracyMeters: 5 },
                network: null
            },
            clientTimestamp: new Date().toISOString()
        });

        const pendingBefore = await getPendingCount(facultyId);
        if (pendingBefore !== 1) {
            throw new Error(`Expected 1 pending event, found ${pendingBefore}.`);
        }

        // Trigger synchronization with backend server
        const syncResult = await syncUserEvents(accessToken, facultyId);

        if (!syncResult.success || syncResult.syncedCount !== 1) {
            throw new Error(`Sync dispatch failed: ${syncResult.message || JSON.stringify(syncResult)}`);
        }

        // Check SQLite status updated to SYNCED
        const eventInDb = await getEventById(checkInEventId);
        if (eventInDb.status !== "SYNCED") {
            throw new Error(`Expected SQLite status SYNCED, found ${eventInDb.status}`);
        }

        // Verify MongoDB authoritative record was created
        const mongoAttendance = await AttendanceRecord.findOne({ syncEventId: checkInEventId });
        if (!mongoAttendance || !mongoAttendance.checkInTime) {
            throw new Error("AttendanceRecord not found in MongoDB with matching syncEventId.");
        }

        record(4, "Offline Check-In Enqueue & Authoritative Server Synchronization", "PASS",
            `Event '${checkInEventId}' synchronized. Created authoritative attendanceId: ${mongoAttendance.attendanceId} (Status: ${mongoAttendance.status}).`);
    } catch (err) {
        record(4, "Offline Check-In Enqueue & Authoritative Server Synchronization", "FAIL", err.message);
    }

    // ========================================================
    // GATE 5: Server Idempotency & Duplicate Event Deduplication
    // ========================================================
    try {
        // Re-enqueue the same eventId or replay sync request directly
        const replayResponse = await syncAttendanceEvent({
            eventId: checkInEventId,
            eventType: "CHECK_IN",
            facultyId,
            userId: facultyId,
            payload: { device: { platform: "android" } },
            clientTimestamp: new Date().toISOString()
        }, accessToken);

        if (!replayResponse?.duplicate && replayResponse?.status !== "DUPLICATE") {
            throw new Error(`Expected server duplicate acknowledgement, got: ${JSON.stringify(replayResponse)}`);
        }

        // Verify duplicate did not create a second attendance record
        const matchingRecords = await AttendanceRecord.countDocuments({ syncEventId: checkInEventId });
        if (matchingRecords !== 1) {
            throw new Error(`Expected exactly 1 attendance record in MongoDB, found ${matchingRecords}.`);
        }

        record(5, "Server Idempotency & Duplicate Event Deduplication", "PASS",
            `Replaying event '${checkInEventId}' returned DUPLICATE acknowledgement without creating redundant attendance records.`);
    } catch (err) {
        record(5, "Server Idempotency & Duplicate Event Deduplication", "FAIL", err.message);
    }

    // ========================================================
    // GATE 6: Offline Check-Out Enqueue & Sequential Synchronization
    // ========================================================
    const checkOutEventId = generateSyncEventId(facultyId, "CHECK_OUT");
    try {
        // Enqueue offline check-out
        await enqueueOfflineEvent({
            eventId: checkOutEventId,
            userId: facultyId,
            eventType: "CHECK_OUT",
            payload: {
                device: { platform: "android", model: "Pixel 8" },
                location: { latitude: 0, longitude: 0, accuracyMeters: 5 },
                network: null
            },
            clientTimestamp: new Date().toISOString()
        });

        // Dispatch sync
        const syncResult = await syncUserEvents(accessToken, facultyId);

        if (!syncResult.success || syncResult.syncedCount !== 1) {
            throw new Error(`Check-out sync failed: ${syncResult.message}`);
        }

        const checkOutInDb = await getEventById(checkOutEventId);
        if (checkOutInDb.status !== "SYNCED") {
            throw new Error(`Expected SQLite check-out status SYNCED, found ${checkOutInDb.status}`);
        }

        // Verify MongoDB record was updated with authoritative checkOutTime
        const mongoAttendance = await AttendanceRecord.findOne({ facultyId });
        if (!mongoAttendance || !mongoAttendance.checkOutTime) {
            throw new Error("AttendanceRecord in MongoDB was not updated with checkOutTime.");
        }

        record(6, "Offline Check-Out Enqueue & Sequential Synchronization", "PASS",
            `Check-out '${checkOutEventId}' synchronized. MongoDB updated checkOutTime: ${mongoAttendance.checkOutTime}.`);
    } catch (err) {
        record(6, "Offline Check-Out Enqueue & Sequential Synchronization", "FAIL", err.message);
    }

    // ========================================================
    // GATE 7: Bounded Retries, Error Tracking & Session Expiry Guard
    // ========================================================
    try {
        const errorEventId = "TEST-ERROR-EVENT-RETRY";
        await enqueueOfflineEvent({
            eventId: errorEventId,
            userId: facultyId,
            eventType: "CHECK_IN", // Already checked out for today -> server will reject
            payload: { device: null, location: null },
            clientTimestamp: new Date().toISOString()
        });

        // 1. Verify bounded retry and error recording
        await syncUserEvents(accessToken, facultyId);
        const failedEvent = await getEventById(errorEventId);

        if (!failedEvent || failedEvent.attemptCount < 1 || !failedEvent.lastError) {
            throw new Error("Failed to record attempt count or error message upon sync rejection.");
        }

        // 2. Verify Session Expiry Guard (401 halts sync safely without discarding queued events)
        const expiredEventId = "TEST-AUTH-EXPIRED-EVENT";
        await enqueueOfflineEvent({
            eventId: expiredEventId,
            userId: facultyId,
            eventType: "CHECK_IN",
            payload: { device: null, location: null },
            clientTimestamp: new Date().toISOString()
        });

        const fakeToken = "invalid_expired_token_123";
        const expiredSyncResult = await syncUserEvents(fakeToken, facultyId);

        if (expiredSyncResult.status !== "AUTH_EXPIRED" && expiredSyncResult.status !== "NO_AUTH") {
            throw new Error(`Expected AUTH_EXPIRED status, got: ${expiredSyncResult.status}`);
        }

        // Ensure the queued event is NOT dropped or marked FAILED upon 401
        const preservedEvent = await getEventById(expiredEventId);
        if (preservedEvent.status === "SYNCED") {
            throw new Error("Event should not be marked SYNCED under expired authentication.");
        }
        if (preservedEvent.status !== "PENDING") {
            throw new Error(`Expected event to remain PENDING after 401, found: ${preservedEvent.status}`);
        }

        await clearUserQueue(facultyId);

        record(7, "Bounded Retries, Error Tracking & Session Expiry Guard", "PASS",
            `Attempt count tracked, lastError recorded ('${failedEvent.lastError.substring(0, 35)}...'), and 401 halted sync safely without dropping queue.`);
    } catch (err) {
        record(7, "Bounded Retries, Error Tracking & Session Expiry Guard", "FAIL", err.message);
    }

    // ========================================================
    // SUMMARY
    // ========================================================
    console.log("\n====================================================");
    console.log("            PHASE 3 VERIFICATION SUMMARY            ");
    console.log("====================================================");
    let allPassed = true;
    for (const r of results) {
        console.log(`[${r.status}] ${r.gate}. ${r.title}`);
        if (r.status !== "PASS") allPassed = false;
    }
    console.log("====================================================");
    if (allPassed) {
        console.log("OVERALL: ALL 7 GATES PASSED (100%)");
    } else {
        console.log("OVERALL: SOME GATES FAILED — REVIEW DETAILS ABOVE");
    }
    console.log("====================================================");

    await mongooseMod.disconnect();
    process.exit(allPassed ? 0 : 1);
}

runMobilePhase3Tests().catch((err) => {
    console.error("Fatal test runner exception:", err);
    process.exit(1);
});
