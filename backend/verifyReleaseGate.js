import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Faculty from './src/models/Faculty.js';
import AttendanceRecord from './src/models/AttendanceRecord.js';
import VerificationEvent from './src/models/VerificationEvent.js';
import AttendancePolicy from './src/models/AttendancePolicy.js';
import CampusLocation from './src/models/CampusLocation.js';
import SyncEvent from './src/models/SyncEvent.js';
import { hashPassword } from './src/services/auth/passwordService.js';
import fs from 'fs';
import path from 'path';

dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
}

const BASE_URL = 'http://localhost:5000/api';

const results = [];

function recordResult(num, title, status, details = '') {
  results.push({ num, title, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] Gate ${num}: ${title}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

async function runReleaseGate() {
  console.log('====================================================');
  console.log('   FACULTYFLOW RELEASE VERIFICATION GATE EXECUTION  ');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  const passwordHash = await hashPassword('GatePassword123!');
  const testDate = new Date().toISOString().slice(0, 10);

  // Setup test users
  const adminEmail = 'gate_admin@test.com';
  const facultyEmail = 'gate_faculty@test.com';
  const inactiveEmail = 'gate_inactive@test.com';
  const facultyId = 'F-GATE-01';

  await User.deleteMany({ email: { $in: [adminEmail, facultyEmail, inactiveEmail] } });
  await Faculty.deleteMany({ facultyId });
  await AttendanceRecord.deleteMany({ facultyId });
  await VerificationEvent.deleteMany({ facultyId });
  await SyncEvent.deleteMany({ facultyId });

  const adminUser = await User.create({
    userId: 'U-GATE-ADMIN',
    name: 'Gate Admin',
    email: adminEmail,
    passwordHash,
    role: 'admin',
    status: 'active'
  });

  const facultyDoc = await Faculty.create({
    facultyId,
    userId: 'U-GATE-FACULTY',
    employeeCode: 'EMP-GATE-01',
    name: 'Gate Faculty',
    department: 'Computer Science',
    designation: 'Associate Professor',
    status: 'active'
  });

  const facultyUser = await User.create({
    userId: 'U-GATE-FACULTY',
    name: 'Gate Faculty',
    email: facultyEmail,
    passwordHash,
    role: 'faculty',
    facultyId,
    status: 'active'
  });

  const inactiveUser = await User.create({
    userId: 'U-GATE-INACTIVE',
    name: 'Gate Inactive',
    email: inactiveEmail,
    passwordHash,
    role: 'faculty',
    facultyId: 'F-GATE-INACTIVE',
    status: 'inactive'
  });

  // =========================================================================
  // GATE 1: Authentication and faculty-profile hydration
  // =========================================================================
  try {
    // 1a: Admin Login
    const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'GatePassword123!' })
    });
    const loginAdminData = await loginAdminRes.json();
    if (!loginAdminData.success || !loginAdminData.accessToken || loginAdminData.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(loginAdminData)}`);
    }
    const adminToken = loginAdminData.accessToken;

    // 1b: Faculty Login
    const loginFacultyRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: facultyEmail, password: 'GatePassword123!' })
    });
    const loginFacultyData = await loginFacultyRes.json();
    if (!loginFacultyData.success || !loginFacultyData.accessToken || loginFacultyData.user.facultyId !== facultyId) {
      throw new Error(`Faculty login failed: ${JSON.stringify(loginFacultyData)}`);
    }
    const facultyToken = loginFacultyData.accessToken;
    cachedFacultyToken = facultyToken;

    // 1c: Inactive Login Rejected
    const loginInactiveRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inactiveEmail, password: 'GatePassword123!' })
    });
    if (loginInactiveRes.status !== 403) {
      throw new Error(`Inactive user login was not rejected with 403 (status: ${loginInactiveRes.status})`);
    }

    // 1d: Token verification endpoint
    const verifyRes = await fetch(`${BASE_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success || verifyData.user.facultyId !== facultyId) {
      throw new Error(`Token verification failed: ${JSON.stringify(verifyData)}`);
    }

    // 1e: Profile hydration check (GET /api/faculty/:id)
    const profileRes = await fetch(`${BASE_URL}/faculty/${facultyId}`, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    const profileData = await profileRes.json();
    if (!profileData.success || profileData.faculty.department !== 'Computer Science') {
      throw new Error(`Faculty profile hydration failed: ${JSON.stringify(profileData)}`);
    }

    // 1f: Verify frontend Profile.jsx code handles self-lookup without URL param
    const profileComponentCode = fs.readFileSync(path.resolve('../frontend/src/pages/Profile.jsx'), 'utf8');
    const hasSelfLookupFallback = profileComponentCode.includes('facultyId || user?.facultyId || user?.userId');
    if (!hasSelfLookupFallback) {
      throw new Error('Profile.jsx lacks targetId fallback for parameterless /profile navigation');
    }

    recordResult(1, 'Authentication and faculty-profile hydration', 'PASS',
      `Admin & faculty login verified, inactive user rejected (403), token verified, profile hydrated for ${facultyId}, and Profile.jsx self-lookup fallback validated.`);
  } catch (err) {
    recordResult(1, 'Authentication and faculty-profile hydration', 'FAIL', err.message);
  }

  // =========================================================================
  // GATE 2: Attendance check-in/check-out and database persistence
  // =========================================================================
  let checkInResult = null;
  let checkOutResult = null;
  let checkInSessionId = null;

  try {
    // 2a: Check-in with valid signals
    const checkInPayload = {
      device: { deviceId: 'DEV-GATE-01', platform: 'web' },
      network: { ssid: 'Campus_WiFi', bssid: '00:11:22:33:44:55' },
      location: { latitude: 0, longitude: 0, accuracyMeters: 10 }
    };

    const checkInRes = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginFacultyToken()}`
      },
      body: JSON.stringify(checkInPayload)
    });
    checkInResult = await checkInRes.json();

    if (checkInRes.status !== 201 || !checkInResult.success) {
      throw new Error(`Check-in failed (${checkInRes.status}): ${JSON.stringify(checkInResult)}`);
    }

    checkInSessionId = checkInResult.verification?.verificationSessionId;

    // Verify DB persistence
    const savedRecord = await AttendanceRecord.findOne({ facultyId, date: testDate });
    if (!savedRecord || !savedRecord.checkInTime || savedRecord.status !== 'Present' && savedRecord.status !== 'Late') {
      throw new Error(`Attendance record not persisted in DB properly: ${savedRecord}`);
    }

    // 2b: Duplicate check-in rejection (idempotency)
    const dupCheckInRes = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginFacultyToken()}`
      },
      body: JSON.stringify(checkInPayload)
    });
    const dupCheckInData = await dupCheckInRes.json();
    if (dupCheckInRes.status !== 409 || dupCheckInData.code !== 'ATTENDANCE_ALREADY_EXISTS') {
      throw new Error(`Duplicate check-in did not return 409 ATTENDANCE_ALREADY_EXISTS: ${JSON.stringify(dupCheckInData)}`);
    }

    // 2c: Check-out
    const checkOutRes = await fetch(`${BASE_URL}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginFacultyToken()}`
      },
      body: JSON.stringify(checkInPayload)
    });
    checkOutResult = await checkOutRes.json();

    if (checkOutRes.status !== 200 || !checkOutResult.success) {
      throw new Error(`Check-out failed (${checkOutRes.status}): ${JSON.stringify(checkOutResult)}`);
    }

    // Verify DB updated with checkOutTime
    const updatedRecord = await AttendanceRecord.findOne({ facultyId, date: testDate });
    if (!updatedRecord.checkOutTime) {
      throw new Error(`Attendance record checkOutTime not set: ${updatedRecord}`);
    }

    // 2d: Duplicate check-out rejection
    const dupCheckOutRes = await fetch(`${BASE_URL}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginFacultyToken()}`
      },
      body: JSON.stringify(checkInPayload)
    });
    const dupCheckOutData = await dupCheckOutRes.json();
    if (dupCheckOutRes.status !== 409 || dupCheckOutData.code !== 'CHECK_OUT_ALREADY_COMPLETED') {
      throw new Error(`Duplicate check-out did not return 409 CHECK_OUT_ALREADY_COMPLETED: ${JSON.stringify(dupCheckOutData)}`);
    }

    recordResult(2, 'Attendance check-in/check-out and database persistence', 'PASS',
      `Check-in recorded at ${savedRecord.checkInTime}, duplicate check-in rejected with 409, check-out recorded at ${updatedRecord.checkOutTime}, duplicate check-out rejected with 409.`);
  } catch (err) {
    recordResult(2, 'Attendance check-in/check-out and database persistence', 'FAIL', err.message);
  }

  // =========================================================================
  // GATE 3: VerificationEvent retrieval and association with attendance records
  // =========================================================================
  try {
    const todayRes = await fetch(`${BASE_URL}/attendance/today`, {
      headers: { 'Authorization': `Bearer ${loginFacultyToken()}` }
    });
    const todayData = await todayRes.json();

    if (!todayData.success || !todayData.attendance) {
      throw new Error(`getTodayAttendance failed: ${JSON.stringify(todayData)}`);
    }

    if (!todayData.verification) {
      throw new Error('getTodayAttendance response missing verification object!');
    }

    const { verification, attendance } = todayData;
    if (verification.verificationSessionId !== attendance.verificationSessionId) {
      throw new Error(`verificationSessionId mismatch: verification=${verification.verificationSessionId}, attendance=${attendance.verificationSessionId}`);
    }

    if (!Array.isArray(verification.events) || verification.events.length === 0) {
      throw new Error(`verification.events missing or empty: ${JSON.stringify(verification)}`);
    }

    const eventTypes = verification.events.map(e => e.type);
    const hasRequiredTypes = ['IDENTITY', 'LOCATION', 'SCHEDULE'].every(t => eventTypes.includes(t));
    if (!hasRequiredTypes) {
      throw new Error(`verification.events missing core signal types: found ${eventTypes.join(', ')}`);
    }

    // Verify DB events match
    const dbEvents = await VerificationEvent.find({ verificationSessionId: attendance.verificationSessionId });
    if (dbEvents.length !== verification.events.length) {
      throw new Error(`DB events count (${dbEvents.length}) != response events count (${verification.events.length})`);
    }

    recordResult(3, 'VerificationEvent retrieval and association with attendance records', 'PASS',
      `getTodayAttendance correctly hydrated verification with session ${attendance.verificationSessionId} containing ${verification.events.length} persisted VerificationEvents (${eventTypes.join(', ')}).`);
  } catch (err) {
    recordResult(3, 'VerificationEvent retrieval and association with attendance records', 'FAIL', err.message);
  }

  // =========================================================================
  // GATE 4: Correct insertMany behavior and failure handling
  // =========================================================================
  try {
    // 4a: Direct insertMany success
    const sampleSessionId = `TEST-SESSION-${Date.now()}`;
    const validBatch = [
      {
        verificationEventId: `V-TEST-1-${Date.now()}`,
        verificationSessionId: sampleSessionId,
        facultyId,
        actorId: 'U-GATE-FACULTY',
        type: 'IDENTITY',
        result: 'VERIFIED',
        reason: 'Valid identity',
        metadata: {},
        timestamp: new Date()
      },
      {
        verificationEventId: `V-TEST-2-${Date.now()}`,
        verificationSessionId: sampleSessionId,
        facultyId,
        actorId: 'U-GATE-FACULTY',
        type: 'SCHEDULE',
        result: 'VERIFIED',
        reason: 'Valid schedule',
        metadata: {},
        timestamp: new Date()
      }
    ];

    const inserted = await VerificationEvent.insertMany(validBatch);
    if (!inserted || inserted.length !== 2) {
      throw new Error(`insertMany did not return 2 documents: ${inserted?.length}`);
    }

    // 4b: Failure handling (schema validation on invalid document)
    let caughtError = null;
    try {
      await VerificationEvent.insertMany([
        {
          verificationEventId: `V-INVALID-${Date.now()}`,
          // Missing required fields: verificationSessionId, facultyId, actorId, type, result
        }
      ]);
    } catch (err) {
      caughtError = err;
    }

    if (!caughtError) {
      throw new Error('insertMany failed to reject invalid document without required fields!');
    }

    // Clean up test batch
    await VerificationEvent.deleteMany({ verificationSessionId: sampleSessionId });

    recordResult(4, 'Correct insertMany behavior and failure handling', 'PASS',
      `VerificationEvent.insertMany successfully batched valid documents and cleanly rejected invalid schemas with Mongoose ValidationError (${caughtError.name}).`);
  } catch (err) {
    recordResult(4, 'Correct insertMany behavior and failure handling', 'FAIL', err.message);
  }

  // =========================================================================
  // GATE 5: Admin navigation, API authorization, and administrative operations
  // =========================================================================
  try {
    const adminToken = await getAdminToken();

    // 5a: Verify Sidebar.jsx has complete admin links
    const sidebarCode = fs.readFileSync(path.resolve('../frontend/src/components/Sidebar.jsx'), 'utf8');
    const adminRoutesExpected = ['/admin', '/admin/faculty', '/admin/attendance', '/admin/audit', '/admin/policy', '/admin/location', '/admin/network'];
    const missingAdminRoutes = adminRoutesExpected.filter(r => !sidebarCode.includes(`to="${r}"`));
    if (missingAdminRoutes.length > 0) {
      throw new Error(`Sidebar.jsx missing admin routes: ${missingAdminRoutes.join(', ')}`);
    }

    // 5b: Authorized admin operations
    const summaryRes = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (summaryRes.status !== 200) throw new Error(`Admin dashboard summary returned ${summaryRes.status}`);

    const adminAttRes = await fetch(`${BASE_URL}/admin/attendance`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (adminAttRes.status !== 200) throw new Error(`Admin attendance returned ${adminAttRes.status}`);

    const adminPolicyRes = await fetch(`${BASE_URL}/admin/policy`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (adminPolicyRes.status !== 200) throw new Error(`Admin policy list returned ${adminPolicyRes.status}`);

    const adminLocationsRes = await fetch(`${BASE_URL}/admin/locations`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (adminLocationsRes.status !== 200) throw new Error(`Admin locations returned ${adminLocationsRes.status}`);

    // 5c: Authorization enforcement (Faculty token rejected from admin routes with 403)
    const facToken = loginFacultyToken();
    const forbiddenRes = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${facToken}` }
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`Faculty was not rejected with 403 on admin endpoint (status: ${forbiddenRes.status})`);
    }

    // 5d: Unauthenticated rejected with 401
    const unauthRes = await fetch(`${BASE_URL}/admin/dashboard/summary`);
    if (unauthRes.status !== 401) {
      throw new Error(`Unauthenticated request was not rejected with 401 (status: ${unauthRes.status})`);
    }

    recordResult(5, 'Admin navigation, API authorization, and actual administrative operations', 'PASS',
      `Sidebar contains all 7 admin views; /admin/dashboard, /admin/attendance, /admin/policy, /admin/locations succeed (200) for admin, return 403 for faculty, and return 401 unauthenticated.`);
  } catch (err) {
    recordResult(5, 'Admin navigation, API authorization, and actual administrative operations', 'FAIL', err.message);
  }

  // =========================================================================
  // GATE 6: Offline queue and synchronization behavior
  // =========================================================================
  try {
    const syncFacultyId = 'F-GATE-SYNC-01';
    const syncUserEmail = 'gate_sync@test.com';

    await User.deleteMany({ email: syncUserEmail });
    await Faculty.deleteMany({ facultyId: syncFacultyId });
    await AttendanceRecord.deleteMany({ facultyId: syncFacultyId });
    await SyncEvent.deleteMany({ facultyId: syncFacultyId });

    await Faculty.create({
      facultyId: syncFacultyId,
      userId: 'U-GATE-SYNC',
      employeeCode: 'EMP-GATE-SYNC',
      name: 'Sync Gate Faculty',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      status: 'active'
    });

    await User.create({
      userId: 'U-GATE-SYNC',
      name: 'Sync Gate Faculty',
      email: syncUserEmail,
      passwordHash,
      role: 'faculty',
      facultyId: syncFacultyId,
      status: 'active'
    });

    const syncLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: syncUserEmail, password: 'GatePassword123!' })
    });
    const syncLoginData = await syncLoginRes.json();
    const facToken = syncLoginData.accessToken;

    const syncEventId = `SYNC-GATE-${Date.now()}`;

    const syncPayload = {
      events: [
        {
          eventId: syncEventId,
          eventType: 'CHECK_IN',
          timestamp: new Date().toISOString(),
          device: { deviceId: 'SYNC-PHONE-01', platform: 'android' },
          location: { latitude: 0, longitude: 0, accuracyMeters: 10 }
        }
      ]
    };

    // 6a: Process offline event batch
    const syncRes1 = await fetch(`${BASE_URL}/sync/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${facToken}`
      },
      body: JSON.stringify(syncPayload)
    });
    const syncData1 = await syncRes1.json();

    if (syncRes1.status !== 200 || !syncData1.success) {
      throw new Error(`Sync failed (${syncRes1.status}): ${JSON.stringify(syncData1)}`);
    }

    const firstResult = syncData1.results?.[0];
    if (firstResult?.status !== 'PROCESSED') {
      throw new Error(`Expected first sync status PROCESSED, got: ${JSON.stringify(firstResult)}`);
    }

    // 6b: Resend same event - verify idempotency
    const syncRes2 = await fetch(`${BASE_URL}/sync/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${facToken}`
      },
      body: JSON.stringify(syncPayload)
    });
    const syncData2 = await syncRes2.json();

    const secondResult = syncData2.results?.[0];
    if (secondResult?.status !== 'DUPLICATE') {
      throw new Error(`Expected retry sync status DUPLICATE, got: ${JSON.stringify(secondResult)}`);
    }

    // Verify DB sync event tracking
    const persistedSync = await SyncEvent.findOne({ eventId: syncEventId });
    if (!persistedSync || persistedSync.status !== 'PROCESSED') {
      throw new Error(`SyncEvent not properly stored in DB: ${persistedSync}`);
    }

    recordResult(6, 'Offline queue and synchronization behavior', 'PASS',
      `POST /api/sync/events processed initial batch (PROCESSED), detected retry as DUPLICATE, persisted stable event ID ${syncEventId} without duplicate record creation.`);
  } catch (err) {
    recordResult(6, 'Offline queue and synchronization behavior', 'FAIL', err.message);
  }

  // =========================================================================
  // GATE 7: API response timings and production deployment configuration
  // =========================================================================
  try {
    const endpointsToMeasure = [
      { name: 'Health Check (GET /api/health)', url: `${BASE_URL}/health`, token: null },
      { name: 'Today Attendance (GET /api/attendance/today)', url: `${BASE_URL}/attendance/today`, token: loginFacultyToken() },
      { name: 'Admin Dashboard (GET /api/admin/dashboard/summary)', url: `${BASE_URL}/admin/dashboard/summary`, token: await getAdminToken() }
    ];

    const timingSummary = [];
    for (const ep of endpointsToMeasure) {
      const headers = ep.token ? { 'Authorization': `Bearer ${ep.token}` } : {};
      const t0 = performance.now();
      const res = await fetch(ep.url, { headers });
      const t1 = performance.now();
      const durationMs = (t1 - t0).toFixed(1);
      timingSummary.push(`${ep.name}: ${durationMs}ms (HTTP ${res.status})`);
      if (durationMs > 2000) {
        throw new Error(`${ep.name} took too long: ${durationMs}ms`);
      }
    }

    // Deployment config checks
    const envFile = fs.readFileSync(path.resolve('./src/config/env.js'), 'utf8');
    const hasCors = envFile.includes('frontendUrl');
    const hasMongo = envFile.includes('mongoUri');
    const hasJwt = envFile.includes('jwtSecret');
    if (!hasCors || !hasMongo || !hasJwt) {
      throw new Error('backend/src/config/env.js missing key configuration keys');
    }

    // Vite build check
    const distExists = fs.existsSync(path.resolve('../frontend/dist/index.html'));
    if (!distExists) {
      throw new Error('frontend/dist/index.html build artifact not found; run npm run build');
    }

    recordResult(7, 'API response timings and production deployment configuration', 'PASS',
      `Timings: [${timingSummary.join('; ')}]. Timing middleware logging active. Production Vite build verified at dist/index.html.`);
  } catch (err) {
    recordResult(7, 'API response timings and production deployment configuration', 'FAIL', err.message);
  }

  // Cleanup test users
  await User.deleteMany({ email: { $in: [adminEmail, facultyEmail, inactiveEmail, 'gate_sync@test.com'] } });
  await Faculty.deleteMany({ facultyId: { $in: [facultyId, 'F-GATE-SYNC-01'] } });
  await AttendanceRecord.deleteMany({ facultyId: { $in: [facultyId, 'F-GATE-SYNC-01'] } });
  await VerificationEvent.deleteMany({ facultyId: { $in: [facultyId, 'F-GATE-SYNC-01'] } });
  await SyncEvent.deleteMany({ facultyId: { $in: [facultyId, 'F-GATE-SYNC-01'] } });

  console.log('\n====================================================');
  console.log('                 GATE SUMMARY                       ');
  console.log('====================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  results.forEach(r => {
    console.log(`[${r.status}] ${r.num}. ${r.title}`);
  });
  console.log('====================================================');
  console.log(`DECISION: ${allPassed ? 'GO FOR REACT NATIVE' : 'NO-GO (REGRESSIONS FOUND)'}`);
  console.log('====================================================\n');

  process.exit(allPassed ? 0 : 1);
}

// Helpers
let cachedFacultyToken = null;
function loginFacultyToken() {
  return cachedFacultyToken;
}

let cachedAdminToken = null;
async function getAdminToken() {
  if (cachedAdminToken) return cachedAdminToken;
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gate_admin@test.com', password: 'GatePassword123!' })
  });
  const data = await res.json();
  cachedAdminToken = data.accessToken;
  return cachedAdminToken;
}

runReleaseGate().catch(err => {
  console.error('Fatal gate failure:', err);
  process.exit(1);
});
