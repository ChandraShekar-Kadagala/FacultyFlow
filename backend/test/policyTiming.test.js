import test from "node:test";
import assert from "node:assert/strict";

import {
    timeToMinutes,
    dateToMinutes as scheduleDateToMinutes,
    isBeforeStartTime,
    isWithinStartWindow,
    isWithinAttendanceWindow,
    isAfterEndTime
} from "../src/services/verification/schedule/scheduleMatcher.js";

import {
    dateToMinutes as policyDateToMinutes,
    evaluateCheckInPolicy,
    evaluateCheckOutPolicy
} from "../src/services/attendance/policyService.js";

// Sample active scheduled policy configured in the Admin Portal
const testPolicy = {
    policyId: "POL-TEST",
    attendanceMode: "SCHEDULED",
    startTime: "08:45",
    endTime: "09:43",
    gracePeriod: 30, // graceEnd = 08:45 + 30m = 09:15
    lateThreshold: 60,
    earlyExitThreshold: 60,
    timezone: "Asia/Kolkata",
    requiredSignals: ["IDENTITY", "DEVICE", "NETWORK", "LOCATION", "SCHEDULE"],
    active: true
};

test("timeToMinutes: correctly parses HH:mm format", () => {
    assert.equal(timeToMinutes("08:45"), 8 * 60 + 45); // 525
    assert.equal(timeToMinutes("09:43"), 9 * 60 + 43); // 583
    assert.equal(timeToMinutes("00:00"), 0);
    assert.equal(timeToMinutes("23:59"), 23 * 60 + 59); // 1439
    assert.equal(timeToMinutes("invalid"), null);
    assert.equal(timeToMinutes(null), null);
    assert.equal(timeToMinutes(undefined), null);
});

test("dateToMinutes: timezone-aware conversion on server clock", () => {
    // 08:45 AM IST is 03:15 AM UTC
    const dateAtStart = new Date("2026-10-13T03:15:00.000Z");
    assert.equal(policyDateToMinutes(dateAtStart, "Asia/Kolkata"), 525);
    assert.equal(scheduleDateToMinutes(dateAtStart, "Asia/Kolkata"), 525);

    // 08:51 AM IST is 03:21 AM UTC
    const dateAtCheckInAttempt = new Date("2026-10-13T03:21:00.000Z");
    assert.equal(policyDateToMinutes(dateAtCheckInAttempt, "Asia/Kolkata"), 531);
    assert.equal(scheduleDateToMinutes(dateAtCheckInAttempt, "Asia/Kolkata"), 531);

    // 09:43 AM IST is 04:13 AM UTC
    const dateAtEnd = new Date("2026-10-13T04:13:00.000Z");
    assert.equal(policyDateToMinutes(dateAtEnd, "Asia/Kolkata"), 583);
    assert.equal(scheduleDateToMinutes(dateAtEnd, "Asia/Kolkata"), 583);
});

test("evaluateCheckInPolicy: BEFORE start time (< 08:45 IST)", () => {
    // 08:44 AM IST = 03:14 AM UTC
    const serverTime = new Date("2026-10-13T03:14:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, false);
    assert.equal(result.status, "Rejected");
    assert.equal(result.policyState, "BEFORE_START");
    assert.equal(result.code, "ATTENDANCE_BEFORE_START_WINDOW");
    assert.match(result.reason, /Attendance check-in has not started yet/);
    assert.match(result.reason, /08:45/);
});

test("evaluateCheckInPolicy: EXACTLY at start time (08:45 IST)", () => {
    // 08:45:00 AM IST = 03:15:00 AM UTC
    const serverTime = new Date("2026-10-13T03:15:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, true);
    assert.equal(result.status, "Present");
    assert.equal(result.policyState, "ON_TIME");
    assert.equal(result.code, "ATTENDANCE_ON_TIME");
});

test("evaluateCheckInPolicy: WITHIN grace period (08:51 IST - user's reported time)", () => {
    // 08:51 AM IST = 03:21 AM UTC (exactly the time in the user's mobile screenshot)
    const serverTime = new Date("2026-10-13T03:21:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, true);
    assert.equal(result.status, "Present");
    assert.equal(result.policyState, "ON_TIME");
    assert.equal(result.code, "ATTENDANCE_ON_TIME");
    assert.match(result.reason, /within the allowed grace period/);
});

test("evaluateCheckInPolicy: EXACTLY at grace period boundary (09:15 IST)", () => {
    // 08:45 + 30m = 09:15 AM IST = 03:45 AM UTC
    const serverTime = new Date("2026-10-13T03:45:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, true);
    assert.equal(result.status, "Present");
    assert.equal(result.policyState, "ON_TIME");
    assert.equal(result.code, "ATTENDANCE_ON_TIME");
});

test("evaluateCheckInPolicy: LATE but within attendance window (09:20 IST)", () => {
    // 09:20 AM IST = 03:50 AM UTC (after grace 09:15, before end 09:43)
    const serverTime = new Date("2026-10-13T03:50:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, true);
    assert.equal(result.status, "Late");
    assert.equal(result.policyState, "LATE");
    assert.equal(result.code, "ATTENDANCE_LATE_WINDOW");
    assert.match(result.reason, /late but still within the allowed window/);
});

test("evaluateCheckInPolicy: EXACTLY at end time (09:43 IST)", () => {
    // 09:43:00 AM IST = 04:13:00 AM UTC
    const serverTime = new Date("2026-10-13T04:13:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, true);
    assert.equal(result.status, "Late");
    assert.equal(result.policyState, "LATE");
    assert.equal(result.code, "ATTENDANCE_LATE_WINDOW");
});

test("evaluateCheckInPolicy: AFTER end time (> 09:43 IST)", () => {
    // 09:44 AM IST = 04:14 AM UTC
    const serverTime = new Date("2026-10-13T04:14:00.000Z");
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime });

    assert.equal(result.allowed, false);
    assert.equal(result.status, "Rejected");
    assert.equal(result.policyState, "AFTER_END");
    assert.equal(result.code, "ATTENDANCE_AFTER_END_WINDOW");
    assert.match(result.reason, /Attendance check-in window has ended/);
    assert.match(result.reason, /09:43/);
});

test("evaluateCheckInPolicy: SERVER_TIME_UNAVAILABLE on invalid date", () => {
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime: new Date("invalid") });
    assert.equal(result.allowed, false);
    assert.equal(result.code, "SERVER_TIME_UNAVAILABLE");
});

test("evaluateCheckInPolicy: Independent of client/server host timezone drift", () => {
    // A timestamp created anywhere in the world representing 08:51 AM IST
    const internationalTime = new Date("2026-10-12T23:21:00-04:00"); // 11:21 PM EDT previous day = 03:21 AM UTC = 08:51 AM IST
    const result = evaluateCheckInPolicy({ policy: testPolicy, serverTime: internationalTime });

    assert.equal(result.allowed, true);
    assert.equal(result.status, "Present");
    assert.equal(result.code, "ATTENDANCE_ON_TIME");
});

test("evaluateCheckOutPolicy: Early exit vs normal exit", () => {
    const checkoutPolicy = {
        ...testPolicy,
        startTime: "09:00",
        endTime: "17:00",
        earlyExitThreshold: 60 // 16:00 is early exit boundary
    };

    // 15:30 IST = 10:00 UTC (before 16:00 -> early exit)
    const earlyTime = new Date("2026-10-13T10:00:00.000Z");
    const earlyResult = evaluateCheckOutPolicy({ policy: checkoutPolicy, serverTime: earlyTime });
    assert.equal(earlyResult.allowed, true);
    assert.equal(earlyResult.earlyExit, true);
    assert.equal(earlyResult.policyState, "EARLY_EXIT");

    // 16:30 IST = 11:00 UTC (after 16:00 -> normal exit)
    const normalTime = new Date("2026-10-13T11:00:00.000Z");
    const normalResult = evaluateCheckOutPolicy({ policy: checkoutPolicy, serverTime: normalTime });
    assert.equal(normalResult.allowed, true);
    assert.equal(normalResult.earlyExit, false);
    assert.equal(normalResult.policyState, "NORMAL_EXIT");
});
