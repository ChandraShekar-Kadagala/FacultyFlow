import test from "node:test";
import assert from "node:assert/strict";

import {
    calculateWorkingDuration,
    formatDurationMinutes
} from "../src/utils/attendance/durationUtils.js";

import {
    evaluateCheckInPolicy,
    evaluateCheckOutPolicy
} from "../src/services/attendance/policyService.js";

import {
    formatAttendanceRecord
} from "../src/services/attendance/attendanceService.js";

// Flexible institutional attendance policy
const flexiblePolicy = {
    policyId: "POL-FLEX-TEST",
    attendanceMode: "FLEXIBLE",
    startTime: null,
    endTime: null,
    gracePeriod: 0,
    lateThreshold: 0,
    earlyExitThreshold: 0,
    minWorkingHours: 8,
    timezone: "Asia/Kolkata",
    requiredSignals: ["IDENTITY", "DEVICE", "NETWORK", "LOCATION"],
    active: true
};

test("durationUtils: calculateWorkingDuration with whole hours", () => {
    // 8 hours working day: 09:00 to 17:00
    const checkIn = new Date("2026-10-14T09:00:00.000Z");
    const checkOut8h = new Date("2026-10-14T17:00:00.000Z");
    const dur8 = calculateWorkingDuration(checkIn, checkOut8h);

    assert.equal(dur8.minutes, 480);
    assert.equal(dur8.hours, 8);
    assert.equal(dur8.remainingMinutes, 0);
    assert.equal(dur8.formatted, "8 hours");
    assert.equal(dur8.formattedCompact, "8h 00m");
    assert.equal(dur8.isCompleted, true);
    assert.equal(dur8.isOngoing, false);

    // 9 hours working day: 09:00 to 18:00
    const checkOut9h = new Date("2026-10-14T18:00:00.000Z");
    const dur9 = calculateWorkingDuration(checkIn, checkOut9h);
    assert.equal(dur9.minutes, 540);
    assert.equal(dur9.hours, 9);
    assert.equal(dur9.formatted, "9 hours");

    // 10 hours working day: 08:30 to 18:30
    const checkOut10h = new Date("2026-10-14T19:00:00.000Z");
    const dur10 = calculateWorkingDuration(checkIn, checkOut10h);
    assert.equal(dur10.minutes, 600);
    assert.equal(dur10.hours, 10);
    assert.equal(dur10.formatted, "10 hours");
});

test("durationUtils: calculateWorkingDuration with mixed hours and minutes", () => {
    // 8h 35m: 08:45 to 17:20
    const checkIn = new Date("2026-10-14T08:45:00.000Z");
    const checkOut = new Date("2026-10-14T17:20:00.000Z");
    const dur = calculateWorkingDuration(checkIn, checkOut);

    assert.equal(dur.minutes, 515);
    assert.equal(dur.hours, 8);
    assert.equal(dur.remainingMinutes, 35);
    assert.equal(dur.formatted, "8h 35m");
    assert.equal(dur.formattedCompact, "8h 35m");
});

test("durationUtils: calculateWorkingDuration with active ongoing session", () => {
    // Checked in at 09:00, current time is 11:15 -> 2h 15m ongoing
    const checkIn = new Date("2026-10-14T09:00:00.000Z");
    const currentTime = new Date("2026-10-14T11:15:00.000Z");
    const dur = calculateWorkingDuration(checkIn, null, { currentTime });

    assert.equal(dur.isCompleted, false);
    assert.equal(dur.isOngoing, true);
    assert.equal(dur.minutes, 135);
    assert.equal(dur.hours, 2);
    assert.equal(dur.remainingMinutes, 15);
    assert.equal(dur.formatted, "2h 15m");
});

test("durationUtils: calculateWorkingDuration handles under 1 minute", () => {
    const checkIn = new Date("2026-10-14T09:00:00.000Z");
    const checkOutQuick = new Date("2026-10-14T09:00:30.000Z");
    const dur = calculateWorkingDuration(checkIn, checkOutQuick);
    assert.equal(dur.formatted, "0 mins");

    const ongoingQuick = calculateWorkingDuration(checkIn, null, { currentTime: new Date("2026-10-14T09:00:15.000Z") });
    assert.equal(ongoingQuick.formatted, "< 1 min");
});

test("durationUtils: formatDurationMinutes handles various inputs", () => {
    assert.equal(formatDurationMinutes(480), "8 hours");
    assert.equal(formatDurationMinutes(60), "1 hour");
    assert.equal(formatDurationMinutes(515), "8h 35m");
    assert.equal(formatDurationMinutes(45), "45 mins");
    assert.equal(formatDurationMinutes(0), "0 mins");
    assert.equal(formatDurationMinutes(null), "—");
    assert.equal(formatDurationMinutes(undefined), "—");
    assert.equal(formatDurationMinutes(NaN), "—");
});

test("flexibleCheckIn: allows check-in at 07:00, 08:45, 10:15, and 18:30 on same date", () => {
    // 07:00 AM IST = 01:30 AM UTC
    const time0700 = new Date("2026-10-14T01:30:00.000Z");
    const res0700 = evaluateCheckInPolicy({ policy: flexiblePolicy, serverTime: time0700 });
    assert.equal(res0700.allowed, true);
    assert.equal(res0700.status, "Present");
    assert.equal(res0700.code, "ATTENDANCE_FLEXIBLE_TIME");

    // 08:45 AM IST = 03:15 AM UTC
    const time0845 = new Date("2026-10-14T03:15:00.000Z");
    const res0845 = evaluateCheckInPolicy({ policy: flexiblePolicy, serverTime: time0845 });
    assert.equal(res0845.allowed, true);
    assert.equal(res0845.status, "Present");
    assert.equal(res0845.code, "ATTENDANCE_FLEXIBLE_TIME");

    // 10:15 AM IST = 04:45 AM UTC
    const time1015 = new Date("2026-10-14T04:45:00.000Z");
    const res1015 = evaluateCheckInPolicy({ policy: flexiblePolicy, serverTime: time1015 });
    assert.equal(res1015.allowed, true);
    assert.equal(res1015.status, "Present");
    assert.equal(res1015.code, "ATTENDANCE_FLEXIBLE_TIME");

    // 18:30 PM IST = 13:00 PM UTC
    const time1830 = new Date("2026-10-14T13:00:00.000Z");
    const res1830 = evaluateCheckInPolicy({ policy: flexiblePolicy, serverTime: time1830 });
    assert.equal(res1830.allowed, true);
    assert.equal(res1830.status, "Present");
    assert.equal(res1830.code, "ATTENDANCE_FLEXIBLE_TIME");
});

test("flexibleCheckOut: allows checkout at any time without early exit penalties", () => {
    // Check out at 17:00 IST = 11:30 AM UTC
    const time1700 = new Date("2026-10-14T11:30:00.000Z");
    const res = evaluateCheckOutPolicy({ policy: flexiblePolicy, serverTime: time1700 });
    assert.equal(res.earlyExit, false);
    assert.equal(res.policyState, "NORMAL_EXIT");
});

test("formatAttendanceRecord: properly formats records with duration fields", () => {
    // Record after completed checkout (8h)
    const completedRecord = {
        attendanceId: "ATT-F101-2026-10-14",
        facultyId: "F101",
        date: "2026-10-14",
        checkInTime: new Date("2026-10-14T09:00:00.000Z"),
        checkOutTime: new Date("2026-10-14T17:00:00.000Z"),
        status: "Completed",
        verificationStatus: "Verified"
    };

    const formatted = formatAttendanceRecord(completedRecord);
    assert.equal(formatted.workingDurationMinutes, 480);
    assert.equal(formatted.workingDurationFormatted, "8 hours");
    assert.equal(formatted.workingDurationCompact, "8h 00m");
    assert.equal(formatted.isOngoing, false);

    // Active session record (not checked out yet)
    const activeRecord = {
        attendanceId: "ATT-F101-2026-10-14",
        facultyId: "F101",
        date: "2026-10-14",
        checkInTime: new Date(Date.now() - 3600000), // 1 hour ago
        checkOutTime: null,
        status: "Present",
        verificationStatus: "Verified"
    };

    const activeFormatted = formatAttendanceRecord(activeRecord);
    assert.equal(activeFormatted.isOngoing, true);
    assert.equal(activeFormatted.workingDurationFormatted, null);
    assert.ok(activeFormatted.elapsedMinutes >= 59);
});
