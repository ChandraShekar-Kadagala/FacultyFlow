import test from "node:test";
import assert from "node:assert/strict";

import {
    verifyScheduleTime
} from "../src/services/verification/schedule/scheduleVerificationService.js";
import {
    VERIFICATION_RESULTS
} from "../src/services/verification/verificationConstants.js";

const flexiblePolicy = {
    policyId: "POL-FLEX-TEST-01",
    attendanceMode: "FLEXIBLE",
    startTime: "09:30",
    endTime: "17:00",
    gracePeriod: 15,
    lateThreshold: 30,
    earlyExitThreshold: 0,
    requiredSignals: ["IDENTITY", "LOCATION", "DEVICE", "NETWORK"],
    timezone: "Asia/Kolkata",
    active: true
};

const scheduledPolicy = {
    policyId: "POL-SCHED-TEST-01",
    attendanceMode: "SCHEDULED",
    startTime: "09:00",
    endTime: "17:00",
    gracePeriod: 15,
    lateThreshold: 30,
    earlyExitThreshold: 30,
    requiredSignals: ["IDENTITY", "LOCATION", "DEVICE", "NETWORK", "SCHEDULE"],
    timezone: "Asia/Kolkata",
    active: true
};

test("verifyScheduleTime: in FLEXIBLE mode allows check-in at any time without window rejection", async () => {
    // 07:00 AM IST (01:30 UTC) - Before typical window
    const earlyTime = new Date("2026-10-22T01:30:00.000Z");
    const earlyRes = await verifyScheduleTime({
        serverTime: earlyTime,
        action: "CHECK_IN",
        policy: flexiblePolicy
    });
    assert.equal(earlyRes.result, VERIFICATION_RESULTS.VERIFIED);
    assert.ok(earlyRes.reason.includes("Flexible attendance policy"));

    // 08:30 AM IST (03:00 UTC) - User reported symptom time
    const userTime = new Date("2026-10-22T03:00:00.000Z");
    const userRes = await verifyScheduleTime({
        serverTime: userTime,
        action: "CHECK_IN",
        policy: flexiblePolicy
    });
    assert.equal(userRes.result, VERIFICATION_RESULTS.VERIFIED);

    // 19:30 PM IST (14:00 UTC) - Evening check-in
    const eveningTime = new Date("2026-10-22T14:00:00.000Z");
    const eveningRes = await verifyScheduleTime({
        serverTime: eveningTime,
        action: "CHECK_IN",
        policy: flexiblePolicy
    });
    assert.equal(eveningRes.result, VERIFICATION_RESULTS.VERIFIED);
});

test("verifyScheduleTime: in SCHEDULED mode strictly enforces start, grace, and end boundaries", async () => {
    // 08:45 AM IST (03:15 UTC) - Before start (09:00 IST)
    const beforeStart = new Date("2026-10-22T03:15:00.000Z");
    const beforeRes = await verifyScheduleTime({
        serverTime: beforeStart,
        action: "CHECK_IN",
        policy: scheduledPolicy
    });
    assert.equal(beforeRes.result, VERIFICATION_RESULTS.FAILED);
    assert.ok(beforeRes.reason.includes("not yet within the allowed attendance window"));

    // 09:10 AM IST (03:40 UTC) - Within grace period (09:00 - 09:15 IST)
    const onTime = new Date("2026-10-22T03:40:00.000Z");
    const onTimeRes = await verifyScheduleTime({
        serverTime: onTime,
        action: "CHECK_IN",
        policy: scheduledPolicy
    });
    assert.equal(onTimeRes.result, VERIFICATION_RESULTS.VERIFIED);
    assert.equal(onTimeRes.metadata.attendanceStatus, "ON_TIME");

    // 09:30 AM IST (04:00 UTC) - Late but within window
    const lateTime = new Date("2026-10-22T04:00:00.000Z");
    const lateRes = await verifyScheduleTime({
        serverTime: lateTime,
        action: "CHECK_IN",
        policy: scheduledPolicy
    });
    assert.equal(lateRes.result, VERIFICATION_RESULTS.VERIFIED);
    assert.equal(lateRes.metadata.attendanceStatus, "LATE");

    // 17:30 PM IST (12:00 UTC) - After end window (17:00 IST)
    const afterEndTime = new Date("2026-10-22T12:00:00.000Z");
    const afterRes = await verifyScheduleTime({
        serverTime: afterEndTime,
        action: "CHECK_IN",
        policy: scheduledPolicy
    });
    assert.equal(afterRes.result, VERIFICATION_RESULTS.FAILED);
    assert.ok(afterRes.reason.includes("outside the configured attendance period"));
});

test("verifyScheduleTime: invalid server time returns FAILED", async () => {
    const invalidRes = await verifyScheduleTime({
        serverTime: new Date("invalid"),
        action: "CHECK_IN",
        policy: flexiblePolicy
    });
    assert.equal(invalidRes.result, VERIFICATION_RESULTS.FAILED);
    assert.equal(invalidRes.reason, "Authoritative server time is invalid.");
});
