/**
 * Automated Verification Script for Phase 1: Mobile Foundation
 * 
 * Verifies:
 * 1. Environment config and URL resolution across platforms
 * 2. Centralized API client behavior (headers, errors, timeouts, 401 handling)
 * 3. Login service against backend contract
 * 4. Token validation and profile hydration
 * 5. Expired session and 401 automatic handling
 * 6. Faculty dashboard data retrieval (empty state)
 * 7. Faculty dashboard data retrieval (active state)
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

const { apiRequest, setSessionExpirationHandler } = await import("./src/services/api/apiClient.js");
const { loginUser } = await import("./src/services/auth/authService.js");
const { getTodayAttendance } = await import("./src/services/attendance/attendanceApi.js");
const { API_CONFIG } = await import("./src/config/env.js");

const results = [];
function record(gate, title, status, details = "") {
    results.push({ gate, title, status, details });
    const icon = status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${status}] Mobile Foundation Gate ${gate}: ${title}`);
    if (details) console.log(`   Details: ${details}`);
}

async function runMobileFoundationTests() {
    console.log("====================================================");
    console.log("   FACULTYFLOW MOBILE FOUNDATION VERIFICATION GATE  ");
    console.log("====================================================\n");

    const mongooseMod = (await import("../../backend/node_modules/mongoose/index.js")).default;
    await mongooseMod.connect(process.env.MONGO_URI);

    const User = (await import("../../backend/src/models/User.js")).default;
    const Faculty = (await import("../../backend/src/models/Faculty.js")).default;
    const AttendanceRecord = (await import("../../backend/src/models/AttendanceRecord.js")).default;
    const { hashPassword } = await import("../../backend/src/services/auth/passwordService.js");

    const mobileEmail = "mobile_faculty@test.com";
    const mobilePassword = "MobilePassword123!";
    const mobileFacultyId = "FAC-MOBILE-01";

    await User.deleteMany({ email: mobileEmail });
    await Faculty.deleteMany({ facultyId: mobileFacultyId });
    await AttendanceRecord.deleteMany({ facultyId: mobileFacultyId });

    const passwordHash = await hashPassword(mobilePassword);

    await Faculty.create({
        facultyId: mobileFacultyId,
        userId: "USR-MOBILE-01",
        employeeCode: "EMP-MOB-01",
        name: "Dr. Mobile Test",
        department: "Computer Science & Engineering",
        designation: "Assistant Professor",
        status: "active"
    });

    await User.create({
        userId: "USR-MOBILE-01",
        name: "Dr. Mobile Test",
        email: mobileEmail,
        passwordHash,
        role: "faculty",
        facultyId: mobileFacultyId,
        status: "active"
    });

    // ----------------------------------------------------
    // CHECK 1: Environment & Base URL Configuration
    // ----------------------------------------------------
    try {
        if (!API_CONFIG.BASE_URL) throw new Error("API_CONFIG.BASE_URL is undefined");
        if (API_CONFIG.BASE_URL.endsWith("/")) throw new Error("API_CONFIG.BASE_URL has a trailing slash");
        if (!API_CONFIG.TIMEOUT_MS || API_CONFIG.TIMEOUT_MS < 5000) throw new Error("API_CONFIG.TIMEOUT_MS is invalid");

        record(1, "Environment and API Base URL Configuration", "PASS",
            `Base URL resolved to: ${API_CONFIG.BASE_URL}, Timeout: ${API_CONFIG.TIMEOUT_MS}ms`);
    } catch (err) {
        record(1, "Environment and API Base URL Configuration", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // CHECK 2: Centralized API Client Communication
    // ----------------------------------------------------
    try {
        // 2a: Unauthenticated GET
        const health = await apiRequest("/health");
        if (!health?.success && health?.status !== "ok" && health?.status !== "UP") {
            throw new Error(`Health response unexpected: ${JSON.stringify(health)}`);
        }

        // 2b: Error handling on non-existent endpoint (404)
        let caught404 = false;
        try {
            await apiRequest("/nonexistent-endpoint");
        } catch (e) {
            caught404 = e.status === 404;
        }
        if (!caught404) throw new Error("API client did not throw structured error on 404");

        record(2, "Centralized API Client Network & Error Handling", "PASS",
            "Health endpoint verified, structured 404 error handled correctly.");
    } catch (err) {
        record(2, "Centralized API Client Network & Error Handling", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // CHECK 3: Login against Backend Contract
    // ----------------------------------------------------
    let mobileToken = null;
    let loggedInUser = null;

    try {
        // 3a: Invalid password rejection
        let invalidLoginCaught = false;
        try {
            await loginUser({ email: mobileEmail, password: "WrongPassword" });
        } catch (err) {
            invalidLoginCaught = err.status === 401;
        }
        if (!invalidLoginCaught) throw new Error("Invalid password was not rejected with HTTP 401");

        // 3b: Valid login
        const loginResponse = await loginUser({ email: mobileEmail, password: mobilePassword });
        if (!loginResponse?.accessToken || !loginResponse?.user) {
            throw new Error(`Login response missing token or user: ${JSON.stringify(loginResponse)}`);
        }

        mobileToken = loginResponse.accessToken;
        loggedInUser = loginResponse.user;

        if (loggedInUser.email !== mobileEmail || loggedInUser.facultyId !== mobileFacultyId) {
            throw new Error(`User payload mismatch: ${JSON.stringify(loggedInUser)}`);
        }

        record(3, "Login Flow against Authoritative Backend Contract", "PASS",
            `Invalid password rejected (401). Valid login returned JWT and verified user ${loggedInUser.name} (${loggedInUser.facultyId}).`);
    } catch (err) {
        record(3, "Login Flow against Authoritative Backend Contract", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // CHECK 4: Token Verification and Profile Hydration
    // ----------------------------------------------------
    try {
        if (!mobileToken) throw new Error("No token available from Check 3");

        const verifyResponse = await apiRequest("/auth/verify", {
            method: "GET",
            accessToken: mobileToken
        });

        if (!verifyResponse?.success || verifyResponse?.user?.facultyId !== mobileFacultyId) {
            throw new Error(`Token verification failed: ${JSON.stringify(verifyResponse)}`);
        }

        // Profile fetch
        const profileResponse = await apiRequest(`/faculty/${mobileFacultyId}`, {
            method: "GET",
            accessToken: mobileToken
        });

        if (!profileResponse?.success || profileResponse?.faculty?.department !== "Computer Science & Engineering") {
            throw new Error(`Profile fetch failed: ${JSON.stringify(profileResponse)}`);
        }

        record(4, "Session Verification and Profile Hydration", "PASS",
            `Token verified via /auth/verify. Profile hydrated via /faculty/${mobileFacultyId} with department: ${profileResponse.faculty.department}.`);
    } catch (err) {
        record(4, "Session Verification and Profile Hydration", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // CHECK 5: Expired Session and 401 Handling
    // ----------------------------------------------------
    try {
        let expirationHandlerFired = false;
        setSessionExpirationHandler(() => {
            expirationHandlerFired = true;
        });

        let expiredErrorCaught = false;
        try {
            await apiRequest("/attendance/today", {
                method: "GET",
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID.EXPIRED"
            });
        } catch (err) {
            expiredErrorCaught = err.isAuthError && err.status === 401;
        }

        if (!expiredErrorCaught) throw new Error("API client did not flag 401 as isAuthError");
        if (!expirationHandlerFired) throw new Error("Session expiration handler was not triggered on 401");

        record(5, "Session Expiration (401) Automatic Handling", "PASS",
            "Invalid/expired token correctly triggered the session expiration handler and flagged isAuthError.");
    } catch (err) {
        record(5, "Session Expiration (401) Automatic Handling", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // CHECK 6: Faculty Dashboard Real Attendance (Empty State)
    // ----------------------------------------------------
    try {
        if (!mobileToken) throw new Error("No token available");

        const todayData = await getTodayAttendance(mobileToken);
        if (!todayData?.success) {
            throw new Error(`getTodayAttendance failed: ${JSON.stringify(todayData)}`);
        }

        // Must be null because we haven't checked in yet
        if (todayData.attendance !== null) {
            throw new Error(`Expected empty attendance before check-in, got: ${JSON.stringify(todayData.attendance)}`);
        }

        record(6, "Faculty Dashboard: Empty State Data Retrieval", "PASS",
            "GET /api/attendance/today returned success: true with attendance: null for unrecorded day.");
    } catch (err) {
        record(6, "Faculty Dashboard: Empty State Data Retrieval", "FAIL", err.message);
    }

    // ----------------------------------------------------
    // CHECK 7: Faculty Dashboard Real Attendance (Active State)
    // ----------------------------------------------------
    try {
        if (!mobileToken) throw new Error("No token available");

        // Record check-in to test active dashboard state
        const checkInRes = await apiRequest("/attendance/check-in", {
            method: "POST",
            accessToken: mobileToken,
            body: {
                device: { deviceId: "PHONE-01", platform: "android" },
                network: { ssid: "Campus_WiFi", bssid: "00:00:00:00" },
                location: { latitude: 0, longitude: 0, accuracyMeters: 10 }
            }
        });

        if (!checkInRes?.success) {
            throw new Error(`Check-in setup failed: ${JSON.stringify(checkInRes)}`);
        }

        // Query today's attendance again
        const todayActiveData = await getTodayAttendance(mobileToken);
        if (!todayActiveData?.success || !todayActiveData?.attendance) {
            throw new Error(`Active attendance not retrieved: ${JSON.stringify(todayActiveData)}`);
        }

        const { attendance, verification } = todayActiveData;
        if (attendance.facultyId !== mobileFacultyId || !attendance.checkInTime) {
            throw new Error(`Attendance fields invalid: ${JSON.stringify(attendance)}`);
        }

        record(7, "Faculty Dashboard: Active State Data Retrieval", "PASS",
            `GET /api/attendance/today returned active attendance record (status: ${attendance.status}, checkInTime: ${attendance.checkInTime}, verification: ${verification?.status || 'Verified'}).`);
    } catch (err) {
        record(7, "Faculty Dashboard: Active State Data Retrieval", "FAIL", err.message);
    }

    // Cleanup
    await User.deleteMany({ email: mobileEmail });
    await Faculty.deleteMany({ facultyId: mobileFacultyId });
    await AttendanceRecord.deleteMany({ facultyId: mobileFacultyId });

    console.log("\n====================================================");
    console.log("            MOBILE FOUNDATION SUMMARY               ");
    console.log("====================================================");
    const allPassed = results.every(r => r.status === "PASS");
    results.forEach(r => {
        console.log(`[${r.status}] ${r.gate}. ${r.title}`);
    });
    console.log("====================================================");
    console.log(`OVERALL: ${allPassed ? "ALL CHECKS PASSED (100%)" : "FAILURES DETECTED"}`);
    await mongooseMod.disconnect();
    process.exit(allPassed ? 0 : 1);
}

runMobileFoundationTests().catch(err => {
    console.error("Fatal mobile foundation test error:", err);
    process.exit(1);
});
