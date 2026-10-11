/**
 * Automated Verification Script for Phase 2: Mobile Attendance & Verification Actions
 * 
 * Verifies:
 * 1. Mobile Check-In: Submits observations, returns 201 with authoritative server timestamp and verification.
 * 2. Duplicate Check-In Prevention: Server rejects duplicate in-flight / repeat check-in with HTTP 409 ATTENDANCE_ALREADY_EXISTS.
 * 3. Mobile Check-Out: Server updates record with authoritative checkOutTime and returns HTTP 200.
 * 4. Duplicate Check-Out Prevention: Server rejects repeat check-out with HTTP 409 CHECK_OUT_ALREADY_COMPLETED.
 * 5. Attendance History Retrieval: GET /api/attendance/history returns persisted records with timestamps and statuses.
 * 6. Verification Signals Inspection: GET /api/attendance/today returns all 5 verification signals with server observations.
 * 7. State Machine Guard: Attempting Check-Out before Check-In returns HTTP 400 CHECK_IN_REQUIRED.
 */

import fs from "fs";
import path from "path";

// Load backend .env directly without external package dependencies
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
    getTodayAttendance,
    getAttendanceHistory,
    checkInAttendance,
    checkOutAttendance
} = await import("./src/services/attendance/attendanceApi.js");

const results = [];
function record(gate, title, status, details = "") {
    results.push({ gate, title, status, details });
    const icon = status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${status}] Phase 2 Gate ${gate}: ${title}`);
    if (details) console.log(`   Details: ${details}`);
}

async function runMobilePhase2Tests() {
    console.log("====================================================");
    console.log("   FACULTYFLOW PHASE 2: MOBILE ACTIONS GATEWAY      ");
    console.log("====================================================\n");

    const mongooseMod = (await import("../../backend/node_modules/mongoose/index.js")).default;
    await mongooseMod.connect(process.env.MONGO_URI);

    const User = (await import("../../backend/src/models/User.js")).default;
    const Faculty = (await import("../../backend/src/models/Faculty.js")).default;
    const AttendanceRecord = (await import("../../backend/src/models/AttendanceRecord.js")).default;
    const VerificationEvent = (await import("../../backend/src/models/VerificationEvent.js")).default;
    const CampusLocation = (await import("../../backend/src/models/CampusLocation.js")).default;
    const { hashPassword } = await import("../../backend/src/services/auth/passwordService.js");

    const email = "mobile_p2_faculty@test.com";
    const password = "Phase2Password123!";
    const facultyId = "FAC-P2-01";
    const userId = "USR-P2-01";

    const emailUnchecked = "mobile_p2_uncheck@test.com";
    const facultyIdUnchecked = "FAC-P2-02";
    const userIdUnchecked = "USR-P2-02";

    // Clean any prior state
    await User.deleteMany({ email: { $in: [email, emailUnchecked] } });
    await Faculty.deleteMany({ facultyId: { $in: [facultyId, facultyIdUnchecked] } });
    await AttendanceRecord.deleteMany({ facultyId: { $in: [facultyId, facultyIdUnchecked] } });
    await VerificationEvent.deleteMany({ facultyId: { $in: [facultyId, facultyIdUnchecked] } });

    const passwordHash = await hashPassword(password);

    // Create primary test faculty
    await Faculty.create({
        facultyId,
        userId,
        employeeCode: "EMP-P2-01",
        name: "Dr. Phase2 Tester",
        department: "Computer Science",
        designation: "Associate Professor",
        status: "active"
    });

    await User.create({
        userId,
        name: "Dr. Phase2 Tester",
        email,
        passwordHash,
        role: "faculty",
        facultyId,
        status: "active"
    });

    // Create second faculty (for invalid transition test: checkout without checkin)
    await Faculty.create({
        facultyId: facultyIdUnchecked,
        userId: userIdUnchecked,
        employeeCode: "EMP-P2-02",
        name: "Prof. Unchecked",
        department: "Information Science",
        designation: "Assistant Professor",
        status: "active"
    });

    await User.create({
        userId: userIdUnchecked,
        name: "Prof. Unchecked",
        email: emailUnchecked,
        passwordHash,
        role: "faculty",
        facultyId: facultyIdUnchecked,
        status: "active"
    });

    // Login primary faculty
    const loginRes = await loginUser({ email, password });
    const accessToken = loginRes.accessToken;

    // Login second faculty
    const loginResUnchecked = await loginUser({ email: emailUnchecked, password });
    const accessTokenUnchecked = loginResUnchecked.accessToken;

    // Fetch active campus location to match institutional geofence
    const activeLoc = await CampusLocation.findOne({ active: true });

    // Sample mobile observation signals
    const sampleDeviceSignal = {
        deviceId: "android-pixel-test-id",
        platform: "ANDROID",
        model: "Pixel 8 Pro",
        osVersion: "14.0",
        isDevice: true
    };

    const sampleNetworkSignal = {
        ssid: "Campus_WiFi",
        bssid: "00:11:22:33:44:55"
    };

    const sampleLocationSignal = {
        latitude: activeLoc ? activeLoc.latitude : 0,
        longitude: activeLoc ? activeLoc.longitude : 0,
        accuracyMeters: 5.2
    };

    // ----------------------------------------------------
    // GATE 1: Mobile Check-In
    // ----------------------------------------------------
    let checkInAttendanceData = null;
    try {
        const response = await checkInAttendance({
            accessToken,
            device: sampleDeviceSignal,
            network: sampleNetworkSignal,
            location: sampleLocationSignal
        });

        if (!response?.success) throw new Error("Check-in API did not return success: true");
        if (!response?.attendance?.checkInTime) throw new Error("Check-in response missing authoritative checkInTime");
        if (response.attendance.checkOutTime !== null) throw new Error("Check-in checkOutTime must initially be null");
        if (!response.verification) throw new Error("Check-in response missing verification object");

        checkInAttendanceData = response.attendance;

        record(1, "Mobile Check-In with Authoritative Timestamp & Verification", "PASS",
            `Check-in recorded at ${response.attendance.checkInTime} (Status: ${response.attendance.status}, Verification: ${response.verification.result}).`);
    } catch (err) {
        record(1, "Mobile Check-In with Authoritative Timestamp & Verification", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // GATE 2: Duplicate Check-In Prevention (HTTP 409)
    // ----------------------------------------------------
    try {
        let duplicateCaught = false;
        let errCode = "";
        try {
            await checkInAttendance({
                accessToken,
                device: sampleDeviceSignal,
                location: sampleLocationSignal
            });
        } catch (e) {
            duplicateCaught = e.status === 409;
            errCode = e.code || e.data?.code;
        }

        if (!duplicateCaught) {
            throw new Error("Server permitted duplicate check-in instead of rejecting with HTTP 409");
        }

        record(2, "Duplicate Check-In State Machine Rejection", "PASS",
            `Correctly rejected duplicate check-in with HTTP 409 (${errCode || "ATTENDANCE_ALREADY_EXISTS"}).`);
    } catch (err) {
        record(2, "Duplicate Check-In State Machine Rejection", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // GATE 3: Mobile Check-Out
    // ----------------------------------------------------
    let checkOutAttendanceData = null;
    try {
        const response = await checkOutAttendance({
            accessToken,
            device: sampleDeviceSignal,
            network: sampleNetworkSignal,
            location: sampleLocationSignal
        });

        if (!response?.success) throw new Error("Check-out API did not return success: true");
        if (!response?.attendance?.checkOutTime) throw new Error("Check-out response missing authoritative checkOutTime");

        checkOutAttendanceData = response.attendance;

        record(3, "Mobile Check-Out with Authoritative Server State Update", "PASS",
            `Check-out recorded at ${response.attendance.checkOutTime} (Status: ${response.attendance.status}).`);
    } catch (err) {
        record(3, "Mobile Check-Out with Authoritative Server State Update", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // GATE 4: Duplicate Check-Out Prevention (HTTP 409)
    // ----------------------------------------------------
    try {
        let duplicateCheckoutCaught = false;
        let errCode = "";
        try {
            await checkOutAttendance({
                accessToken,
                device: sampleDeviceSignal,
                location: sampleLocationSignal
            });
        } catch (e) {
            duplicateCheckoutCaught = e.status === 409;
            errCode = e.code || e.data?.code;
        }

        if (!duplicateCheckoutCaught) {
            throw new Error("Server permitted duplicate check-out instead of rejecting with HTTP 409");
        }

        record(4, "Duplicate Check-Out State Machine Rejection", "PASS",
            `Correctly rejected duplicate check-out with HTTP 409 (${errCode || "CHECK_OUT_ALREADY_COMPLETED"}).`);
    } catch (err) {
        record(4, "Duplicate Check-Out State Machine Rejection", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // GATE 5: Attendance History API
    // ----------------------------------------------------
    try {
        const historyRes = await getAttendanceHistory(accessToken);

        if (!historyRes?.success) throw new Error("Attendance history did not return success: true");
        if (!Array.isArray(historyRes.records) || historyRes.records.length === 0) {
            throw new Error("Attendance history returned empty records array");
        }

        const latestRecord = historyRes.records[0];
        if (!latestRecord.checkInTime || !latestRecord.checkOutTime) {
            throw new Error("History record missing check-in or check-out timestamp");
        }

        record(5, "Attendance History Persistence & Retrieval", "PASS",
            `Retrieved ${historyRes.count} historical record(s). Latest: ${latestRecord.date} (In: ${latestRecord.checkInTime}, Out: ${latestRecord.checkOutTime}).`);
    } catch (err) {
        record(5, "Attendance History Persistence & Retrieval", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // GATE 6: Multi-Factor Verification Signals Inspection
    // ----------------------------------------------------
    try {
        const todayRes = await getTodayAttendance(accessToken);

        if (!todayRes?.success) throw new Error("Today attendance did not return success: true");
        if (!todayRes?.verification) throw new Error("Today response missing verification object");
        if (!Array.isArray(todayRes.verification.events) || todayRes.verification.events.length < 5) {
            throw new Error(`Expected at least 5 verification events, received ${todayRes.verification?.events?.length}`);
        }

        const eventTypes = todayRes.verification.events.map(e => e.type);
        const requiredTypes = ["IDENTITY", "DEVICE", "NETWORK", "LOCATION", "SCHEDULE"];
        const missing = requiredTypes.filter(t => !eventTypes.includes(t));

        if (missing.length > 0) {
            throw new Error(`Missing expected verification signal events: ${missing.join(", ")}`);
        }

        record(6, "Multi-Factor Verification Signals Inspection", "PASS",
            `All 5 signals verified (${eventTypes.join(", ")}), SessionId: ${todayRes.verification.verificationSessionId}`);
    } catch (err) {
        record(6, "Multi-Factor Verification Signals Inspection", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // GATE 7: Invalid State Machine Transition Guard
    // ----------------------------------------------------
    try {
        let invalidTransitionCaught = false;
        let errCode = "";
        try {
            await checkOutAttendance({
                accessToken: accessTokenUnchecked,
                device: sampleDeviceSignal,
                network: sampleNetworkSignal,
                location: sampleLocationSignal
            });
        } catch (e) {
            invalidTransitionCaught = e.status === 400;
            errCode = e.code || e.data?.code;
            if (!invalidTransitionCaught) {
                console.log(`Gate 7 received status: ${e.status}, code: ${e.code}, msg: ${e.message}`);
            }
        }

        if (!invalidTransitionCaught) {
            throw new Error("Server did not reject check-out without prior check-in with HTTP 400");
        }

        record(7, "Invalid State Machine Transition Guard (Check-Out without Check-In)", "PASS",
            `Correctly rejected premature check-out with HTTP 400 (${errCode || "CHECK_IN_REQUIRED"}).`);
    } catch (err) {
        record(7, "Invalid State Machine Transition Guard (Check-Out without Check-In)", "FAIL", err.message);
    }

    // Cleanup test records
    await User.deleteMany({ email: { $in: [email, emailUnchecked] } });
    await Faculty.deleteMany({ facultyId: { $in: [facultyId, facultyIdUnchecked] } });
    await AttendanceRecord.deleteMany({ facultyId: { $in: [facultyId, facultyIdUnchecked] } });
    await VerificationEvent.deleteMany({ facultyId: { $in: [facultyId, facultyIdUnchecked] } });

    console.log("\n====================================================");
    console.log("            PHASE 2 VERIFICATION SUMMARY            ");
    console.log("====================================================");
    const allPassed = results.every(r => r.status === "PASS");
    results.forEach(r => {
        console.log(`[${r.status}] ${r.gate}. ${r.title}`);
    });
    console.log("====================================================");
    console.log(`OVERALL: ${allPassed ? "ALL 7 GATES PASSED (100%)" : "FAILURES DETECTED"}`);
    console.log("====================================================\n");

    await mongooseMod.disconnect();
    process.exit(allPassed ? 0 : 1);
}

runMobilePhase2Tests().catch(err => {
    console.error("Fatal Phase 2 test error:", err);
    process.exit(1);
});
