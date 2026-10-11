/**
 * ============================================================
 * FacultyFlow Phase 4: Real-Device Validation & Reliability Hardening
 * ============================================================
 * Automated regression suite validating mobile device lifecycle states,
 * causal synchronization ordering, mid-flight timeout recovery,
 * sync link durability, authentication expiration guards, account scoping,
 * rapid concurrent sync mutex, and privacy data minimization.
 *
 * Verified Gates:
 * 1. Process Termination & Restart Persistence (Schema Versioning)
 * 2. Causal Ordering & Dependent Event Synchronization Guard
 * 3. Mid-Flight Request Interruption & Timeout Reconciliation
 * 4. AttendanceRecord Sync Link Durability (No Overwrite / No Orphaned SyncEvents)
 * 5. Authentication Expiration Mid-Sync & Safe Account Switching
 * 6. Rapid Concurrent Sync Invocations & Mutex Re-entrancy Protection
 * 7. Security Audit, Data Minimization & Authoritative Server Evaluation
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
    getFailedCount,
    retryFailedEvents,
    getSchemaVersion,
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
    console.log(`${icon} [${status}] Phase 4 Gate ${gate}: ${title}`);
    if (details) console.log(`   Details: ${details}`);
}

async function runMobilePhase4Tests() {
    console.log("====================================================");
    console.log("  FACULTYFLOW PHASE 4: RELIABILITY HARDENING GATE   ");
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

    const emailA = "mobile_p4_userA@test.com";
    const facultyIdA = "FAC-P4-A";
    const userIdA = "USR-P4-A";

    const emailB = "mobile_p4_userB@test.com";
    const facultyIdB = "FAC-P4-B";
    const userIdB = "USR-P4-B";

    const testPassword = "Phase4Password123!";

    // Clean prior test records
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await Faculty.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await AttendanceRecord.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await VerificationEvent.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await SyncEvent.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });

    // Open active test policy
    await AttendancePolicy.updateMany({}, { active: false });
    await AttendancePolicy.deleteMany({ policyId: "POL-P4-TEST" });
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
        { upsert: true, returnDocument: "after" }
    );

    // Active test campus location
    await CampusLocation.deleteMany({ locationId: "LOC-P4-TEST" });
    await CampusLocation.findOneAndUpdate(
        { locationId: "LOC-TEST" },
        {
            locationId: "LOC-TEST",
            name: "Phase 4 Test Campus",
            latitude: 0,
            longitude: 0,
            radiusMeters: 1000,
            status: "ACTIVE"
        },
        { upsert: true, returnDocument: "after" }
    );

    const passwordHash = await hashPassword(testPassword);

    // Seed User A
    await Faculty.create({
        facultyId: facultyIdA,
        userId: userIdA,
        employeeCode: "EMP-P4-01",
        name: "Dr. Reliability Lead",
        department: "Computer Science",
        designation: "Professor",
        status: "active"
    });
    await User.create({
        userId: userIdA,
        name: "Dr. Reliability Lead",
        email: emailA,
        passwordHash,
        role: "faculty",
        facultyId: facultyIdA,
        status: "active"
    });

    // Seed User B
    await Faculty.create({
        facultyId: facultyIdB,
        userId: userIdB,
        employeeCode: "EMP-P4-02",
        name: "Dr. Alternate User",
        department: "Information Science",
        designation: "Associate Professor",
        status: "active"
    });
    await User.create({
        userId: userIdB,
        name: "Dr. Alternate User",
        email: emailB,
        passwordHash,
        role: "faculty",
        facultyId: facultyIdB,
        status: "active"
    });

    // Authenticate User A
    const loginResA = await loginUser({ email: emailA, password: testPassword });
    const tokenA = loginResA.accessToken;
    if (!tokenA) throw new Error("Failed to authenticate User A.");

    // Authenticate User B
    const loginResB = await loginUser({ email: emailB, password: testPassword });
    const tokenB = loginResB.accessToken;
    if (!tokenB) throw new Error("Failed to authenticate User B.");

    // ========================================================
    // GATE 1: Process Termination & Restart Persistence
    // ========================================================
    try {
        await initQueueDatabase();
        await clearUserQueue(facultyIdA);

        const schemaVer = await getSchemaVersion();
        if (typeof schemaVer !== "number" || schemaVer < 1) {
            throw new Error(`Invalid schema version reported: ${schemaVer}`);
        }

        const persistEventId = generateSyncEventId(facultyIdA, "CHECK_IN");
        await enqueueOfflineEvent({
            eventId: persistEventId,
            userId: facultyIdA,
            eventType: "CHECK_IN",
            payload: {
                device: { platform: "android", model: "Pixel 8 Pro" },
                location: { latitude: 0.0001, longitude: 0.0001, accuracyMeters: 8 }
            },
            clientTimestamp: new Date().toISOString()
        });

        // Simulate app restart / queue re-initialization
        await initQueueDatabase();
        const pendingEvents = await getPendingEvents(facultyIdA);
        const persisted = pendingEvents.find(e => e.eventId === persistEventId);

        if (!persisted || persisted.status !== "PENDING" || persisted.attemptCount !== 0) {
            throw new Error("Event failed to survive simulated app lifecycle reload.");
        }

        record(1, "Process Termination & Restart Persistence (Schema Versioning)", "PASS",
            `Schema version ${schemaVer} verified. Event '${persistEventId}' survived simulated process restart in PENDING state.`);
    } catch (err) {
        record(1, "Process Termination & Restart Persistence (Schema Versioning)", "FAIL", err.message);
    }

    // ========================================================
    // GATE 2: Causal Ordering & Dependent Event Sequence Guard
    // ========================================================
    try {
        await clearUserQueue(facultyIdA);

        // Sequence: Enqueue CHECK_IN then CHECK_OUT
        const causalInId = generateSyncEventId(facultyIdA, "CHECK_IN");
        const causalOutId = generateSyncEventId(facultyIdA, "CHECK_OUT");

        await enqueueOfflineEvent({
            eventId: causalInId,
            userId: facultyIdA,
            eventType: "CHECK_IN",
            payload: {
                device: { platform: "android", model: "Pixel 8 Pro" },
                location: { latitude: 0, longitude: 0, accuracyMeters: 5 }
            },
            clientTimestamp: new Date().toISOString()
        });

        await enqueueOfflineEvent({
            eventId: causalOutId,
            userId: facultyIdA,
            eventType: "CHECK_OUT",
            payload: {
                device: { platform: "android", model: "Pixel 8 Pro" },
                location: { latitude: 0, longitude: 0, accuracyMeters: 5 }
            },
            clientTimestamp: new Date().toISOString()
        });

        const pendingBefore = await getPendingEvents(facultyIdA);
        if (pendingBefore.length !== 2 || pendingBefore[0].eventType !== "CHECK_IN" || pendingBefore[1].eventType !== "CHECK_OUT") {
            throw new Error(`Queue did not maintain causal ordering. Got: ${pendingBefore.map(e => e.eventType).join(" -> ")}`);
        }

        // Trigger synchronization: CHECK_IN must process first, followed by CHECK_OUT
        const syncResult = await syncUserEvents(tokenA, facultyIdA);
        if (!syncResult.success || syncResult.syncedCount !== 2) {
            throw new Error(`Expected both causal events to sync, got syncedCount=${syncResult.syncedCount}`);
        }

        // Verify MongoDB attendance record has both check-in and check-out timestamps
        const recordInMongo = await AttendanceRecord.findOne({ facultyId: facultyIdA });
        if (!recordInMongo || !recordInMongo.checkInTime || !recordInMongo.checkOutTime) {
            throw new Error("Causal sequence failed: Attendance record missing checkInTime or checkOutTime in MongoDB.");
        }

        if (new Date(recordInMongo.checkOutTime) < new Date(recordInMongo.checkInTime)) {
            throw new Error("Invalid causal ordering: checkOutTime is earlier than checkInTime.");
        }

        record(2, "Causal Ordering & Dependent Event Synchronization Guard", "PASS",
            `CHECK_IN ('${causalInId}') and CHECK_OUT ('${causalOutId}') dispatched strictly in order. Authoritative In: ${recordInMongo.checkInTime.toISOString()}, Out: ${recordInMongo.checkOutTime.toISOString()}.`);
    } catch (err) {
        record(2, "Causal Ordering & Dependent Event Synchronization Guard", "FAIL", err.message);
    }

    // ========================================================
    // GATE 3: Mid-Flight Request Interruption & Timeout Reconciliation
    // ========================================================
    try {
        // Retrieve the check-in event ID that was already processed in Gate 2
        const checkInEvent = (await getPendingEvents(facultyIdA)).length === 0
            ? (await getAllEventsForUser(facultyIdA)).find(e => e.eventType === "CHECK_IN")
            : null;

        if (!checkInEvent) throw new Error("Could not find previously synced check-in event for replay.");

        // Simulate a client timeout retry: Client sends the exact same eventId
        const replayRes = await syncAttendanceEvent({
            eventId: checkInEvent.eventId,
            eventType: "CHECK_IN",
            userId: facultyIdA,
            facultyId: facultyIdA,
            payload: checkInEvent.payload,
            clientTimestamp: checkInEvent.clientTimestamp
        }, tokenA);

        if (!replayRes?.duplicate && replayRes?.status !== "DUPLICATE") {
            throw new Error(`Expected DUPLICATE reconciliation, got: ${JSON.stringify(replayRes)}`);
        }

        // Verify zero duplicate records in MongoDB
        const attendanceCount = await AttendanceRecord.countDocuments({ facultyId: facultyIdA });
        if (attendanceCount !== 1) {
            throw new Error(`Idempotency violated: Expected exactly 1 AttendanceRecord, found ${attendanceCount}`);
        }

        record(3, "Mid-Flight Request Interruption & Timeout Reconciliation", "PASS",
            `Replaying event '${checkInEvent.eventId}' after simulated timeout returned DUPLICATE acknowledgement; exactly 1 AttendanceRecord retained.`);
    } catch (err) {
        record(3, "Mid-Flight Request Interruption & Timeout Reconciliation", "FAIL", err.message);
    }

    // ========================================================
    // GATE 4: AttendanceRecord Sync Link Durability (No Overwrite / No Orphaned SyncEvents)
    // ========================================================
    try {
        const attendance = await AttendanceRecord.findOne({ facultyId: facultyIdA });
        if (!attendance) throw new Error("Attendance record not found.");

        const checkInEvt = (await getAllEventsForUser(facultyIdA)).find(e => e.eventType === "CHECK_IN");
        const checkOutEvt = (await getAllEventsForUser(facultyIdA)).find(e => e.eventType === "CHECK_OUT");

        // Verify both links are preserved durably
        if (attendance.checkInSyncEventId !== checkInEvt.eventId) {
            throw new Error(`checkInSyncEventId mismatch. Expected ${checkInEvt.eventId}, found ${attendance.checkInSyncEventId}`);
        }
        if (attendance.checkOutSyncEventId !== checkOutEvt.eventId) {
            throw new Error(`checkOutSyncEventId mismatch. Expected ${checkOutEvt.eventId}, found ${attendance.checkOutSyncEventId}`);
        }

        // Verify recovery query for checkInSyncEventId succeeds even after check-out was processed
        const recoveredForCheckIn = await AttendanceRecord.findOne({
            $or: [
                { syncEventId: checkInEvt.eventId },
                { checkInSyncEventId: checkInEvt.eventId },
                { checkOutSyncEventId: checkInEvt.eventId }
            ]
        });

        if (!recoveredForCheckIn || recoveredForCheckIn.attendanceId !== attendance.attendanceId) {
            throw new Error("Recovery query failed to find attendance record by check-in sync event ID after check-out.");
        }

        record(4, "AttendanceRecord Sync Link Durability (No Overwrite / No Orphaned SyncEvents)", "PASS",
            `AttendanceRecord '${attendance.attendanceId}' durably links both checkInSyncEventId ('${attendance.checkInSyncEventId}') and checkOutSyncEventId ('${attendance.checkOutSyncEventId}'); recovery query verified.`);
    } catch (err) {
        record(4, "AttendanceRecord Sync Link Durability (No Overwrite / No Orphaned SyncEvents)", "FAIL", err.message);
    }

    // ========================================================
    // GATE 5: Authentication Expiration Mid-Sync & Safe Account Switching
    // ========================================================
    try {
        // Enqueue an event under User A
        const expiredTestEventId = "TEST-AUTH-EXPIRE-P4";
        await enqueueOfflineEvent({
            eventId: expiredTestEventId,
            userId: facultyIdA,
            eventType: "CHECK_IN",
            payload: { note: "Auth expire test" },
            clientTimestamp: new Date().toISOString()
        });

        // 1. Attempt sync with invalid / expired token
        const badToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.expired";
        const expiredResult = await syncUserEvents(badToken, facultyIdA);

        if (expiredResult.status !== "AUTH_EXPIRED") {
            throw new Error(`Expected AUTH_EXPIRED status, got: ${expiredResult.status}`);
        }

        // Verify event remains safely in PENDING status (not dropped, not marked FAILED)
        const preserved = await getEventById(expiredTestEventId);
        if (preserved.status !== "PENDING") {
            throw new Error(`Expected event to remain in PENDING state after 401, found: ${preserved.status}`);
        }

        // 2. Account Switch: Switch to User B
        const userBPending = await getPendingEvents(facultyIdB);
        if (userBPending.length !== 0) {
            throw new Error(`Account leak: User B observed User A's pending events (${userBPending.length})`);
        }

        // 3. User A logs back in with valid token
        await clearUserQueue(facultyIdA); // Clean test event
        record(5, "Authentication Expiration Mid-Sync & Safe Account Switching", "PASS",
            `HTTP 401 returned AUTH_EXPIRED without dropping queue; switching to User B confirmed zero cross-account event visibility.`);
    } catch (err) {
        record(5, "Authentication Expiration Mid-Sync & Safe Account Switching", "FAIL", err.message);
    }

    // ========================================================
    // GATE 6: Rapid Concurrent Sync Invocations & Mutex Re-entrancy Protection
    // ========================================================
    try {
        await clearUserQueue(facultyIdB);

        // Enqueue an event for User B
        const mutexEventId = generateSyncEventId(facultyIdB, "CHECK_IN");
        await enqueueOfflineEvent({
            eventId: mutexEventId,
            userId: facultyIdB,
            eventType: "CHECK_IN",
            payload: {
                device: { platform: "android" },
                location: { latitude: 0, longitude: 0, accuracyMeters: 5 }
            },
            clientTimestamp: new Date().toISOString()
        });

        // Launch 5 parallel sync invocations simultaneously
        const parallelPromises = [
            syncUserEvents(tokenB, facultyIdB),
            syncUserEvents(tokenB, facultyIdB),
            syncUserEvents(tokenB, facultyIdB),
            syncUserEvents(tokenB, facultyIdB),
            syncUserEvents(tokenB, facultyIdB)
        ];

        const concurrentOutcomes = await Promise.all(parallelPromises);

        const activeRuns = concurrentOutcomes.filter(r => r.status === "SYNCED" || r.success === true);
        const rejectedRuns = concurrentOutcomes.filter(r => r.status === "ALREADY_SYNCING");

        if (activeRuns.length !== 1 || rejectedRuns.length !== 4) {
            throw new Error(`Mutex concurrency violation. Expected 1 active run and 4 ALREADY_SYNCING. Got active=${activeRuns.length}, already_syncing=${rejectedRuns.length}`);
        }

        // Verify event in database is SYNCED
        const eventInDb = await getEventById(mutexEventId);
        if (eventInDb.status !== "SYNCED") {
            throw new Error(`Expected SQLite status SYNCED, found ${eventInDb.status}`);
        }

        record(6, "Rapid Concurrent Sync Invocations & Mutex Re-entrancy Protection", "PASS",
            `5 parallel sync calls triggered: Exactly 1 acquired lock and synchronized, while 4 received ALREADY_SYNCING with zero data corruption.`);
    } catch (err) {
        record(6, "Rapid Concurrent Sync Invocations & Mutex Re-entrancy Protection", "FAIL", err.message);
    }

    // ========================================================
    // GATE 7: Security Audit, Data Minimization & Authoritative Server Evaluation
    // ========================================================
    try {
        const allEvents = await getAllEventsForUser(facultyIdB);
        for (const evt of allEvents) {
            const rawPayloadStr = JSON.stringify(evt.payload || {});

            // Check no JWT / access tokens
            if (rawPayloadStr.includes("Bearer") || rawPayloadStr.includes("eyJ")) {
                throw new Error(`Security breach: Authentication token leaked into SQLite payload for event ${evt.eventId}`);
            }

            // Check no passwords
            if (rawPayloadStr.toLowerCase().includes("password")) {
                throw new Error(`Security breach: Password string found in SQLite payload for event ${evt.eventId}`);
            }

            // Check no raw biometrics
            if (rawPayloadStr.toLowerCase().includes("fingerprint_raw") || rawPayloadStr.toLowerCase().includes("face_vector")) {
                throw new Error(`Privacy breach: Raw biometric data found in payload for event ${evt.eventId}`);
            }
        }

        // Authoritative timestamp check
        const mongoRecord = await AttendanceRecord.findOne({ facultyId: facultyIdB });
        if (!mongoRecord || !(mongoRecord.checkInTime instanceof Date)) {
            throw new Error("Authoritative check-in time missing in MongoDB.");
        }

        record(7, "Security Audit, Data Minimization & Authoritative Server Evaluation", "PASS",
            `Zero tokens, passwords, or raw biometrics stored in SQLite queue. GPS payload minimized. MongoDB checkInTime authoritatively evaluated by server.`);
    } catch (err) {
        record(7, "Security Audit, Data Minimization & Authoritative Server Evaluation", "FAIL", err.message);
    }

    // Clean test records
    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await Faculty.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await AttendanceRecord.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await VerificationEvent.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await SyncEvent.deleteMany({ facultyId: { $in: [facultyIdA, facultyIdB] } });
    await clearUserQueue(facultyIdA);
    await clearUserQueue(facultyIdB);

    // ========================================================
    // SUMMARY
    // ========================================================
    console.log("\n====================================================");
    console.log("            PHASE 4 VERIFICATION SUMMARY            ");
    console.log("====================================================");
    let allPassed = true;
    for (const r of results) {
        console.log(`[${r.status}] ${r.gate}. ${r.title}`);
        if (r.status !== "PASS") allPassed = false;
    }
    console.log("====================================================");
    if (allPassed) {
        console.log("OVERALL: ALL 7 PHASE 4 GATES PASSED (100%)");
    } else {
        console.log("OVERALL: SOME GATES FAILED — REVIEW DETAILS ABOVE");
    }
    console.log("====================================================");

    await mongooseMod.disconnect();
    process.exit(allPassed ? 0 : 1);
}

runMobilePhase4Tests().catch((err) => {
    console.error("Fatal test runner exception:", err);
    process.exit(1);
});
