import test from "node:test";
import assert from "node:assert/strict";

import {
    createCutoffDate,
    getZonedDateString,
    reconcileOverdueSessions
} from "../src/services/attendance/attendanceReconciliationService.js";
import AttendanceRecord from "../src/models/AttendanceRecord.js";
import { calculateWorkingDuration } from "../src/utils/attendance/durationUtils.js";

test("createCutoffDate: correctly converts date and time in Asia/Kolkata (UTC+5:30) to UTC Date", () => {
    // 23:59:59 IST on 2026-10-14 -> 18:29:59 UTC on 2026-10-14
    const cutoffEnd = createCutoffDate("2026-10-14", "23:59:59", "Asia/Kolkata");
    assert.equal(cutoffEnd.toISOString(), "2026-10-14T18:29:59.000Z");

    // 17:00:00 IST on 2026-10-14 -> 11:30:00 UTC on 2026-10-14
    const cutoff5pm = createCutoffDate("2026-10-14", "17:00:00", "Asia/Kolkata");
    assert.equal(cutoff5pm.toISOString(), "2026-10-14T11:30:00.000Z");

    // UTC timezone verification
    const cutoffUtc = createCutoffDate("2026-10-14", "23:59:59", "UTC");
    assert.equal(cutoffUtc.toISOString(), "2026-10-14T23:59:59.000Z");

    // Default fallback handles missing date
    const fallback = createCutoffDate(null);
    assert.ok(fallback instanceof Date);
});

test("getZonedDateString: accurately resolves local date across midnight boundaries", () => {
    // 2026-10-14 20:00:00 UTC = 2026-10-15 01:30:00 IST (+5:30)
    const dateLateUtc = new Date("2026-10-14T20:00:00.000Z");

    const dateIst = getZonedDateString(dateLateUtc, "Asia/Kolkata");
    assert.equal(dateIst, "2026-10-15");

    const dateUtc = getZonedDateString(dateLateUtc, "UTC");
    assert.equal(dateUtc, "2026-10-14");
});

test("reconciliation: identifies overdue sessions from prior days and closes them", async () => {
    const originalFind = AttendanceRecord.find;
    const originalFindOneAndUpdate = AttendanceRecord.findOneAndUpdate;

    try {
        const mockOpenRecord = {
            _id: "rec_overdue_1",
            facultyId: "FAC-TEST-001",
            date: "2026-10-13", // yesterday
            checkInTime: new Date("2026-10-13T09:00:00.000Z"),
            checkOutTime: null,
            status: "Present"
        };

        AttendanceRecord.find = async (query) => {
            assert.deepEqual(query.checkInTime, { $ne: null });
            assert.equal(query.checkOutTime, null);
            return [mockOpenRecord];
        };

        let updatedRecord = null;
        AttendanceRecord.findOneAndUpdate = async (filter, update) => {
            assert.equal(filter._id, "rec_overdue_1");
            assert.equal(filter.checkOutTime, null); // Ensures idempotency check
            assert.equal(update.$set.status, "Incomplete");
            assert.equal(update.$set.autoClosed, true);
            assert.equal(update.$set.closureReason, "AUTO_CLOSED_END_OF_DAY");
            assert.ok(update.$set.checkOutTime instanceof Date);
            assert.ok(Number.isInteger(update.$set.workingDurationMinutes));

            updatedRecord = {
                ...mockOpenRecord,
                ...update.$set
            };
            return updatedRecord;
        };

        const serverTime = new Date("2026-10-14T10:00:00.000Z"); // Today 15:30 IST
        const result = await reconcileOverdueSessions({
            serverTime,
            policy: {
                attendanceMode: "FLEXIBLE",
                timezone: "Asia/Kolkata"
            }
        });

        assert.equal(result.reconciledCount, 1);
        assert.equal(result.records.length, 1);
        assert.equal(result.records[0].status, "Incomplete");
        assert.equal(result.records[0].autoClosed, true);
        assert.equal(result.records[0].closureReason, "AUTO_CLOSED_END_OF_DAY");
    } finally {
        AttendanceRecord.find = originalFind;
        AttendanceRecord.findOneAndUpdate = originalFindOneAndUpdate;
    }
});

test("reconciliation: does not close today's active session if within operating hours", async () => {
    const originalFind = AttendanceRecord.find;
    const originalFindOneAndUpdate = AttendanceRecord.findOneAndUpdate;

    try {
        const mockActiveTodayRecord = {
            _id: "rec_active_today",
            facultyId: "FAC-TEST-002",
            date: "2026-10-14", // today
            checkInTime: new Date("2026-10-14T03:30:00.000Z"), // 09:00 AM IST
            checkOutTime: null,
            status: "Present"
        };

        AttendanceRecord.find = async () => {
            return [mockActiveTodayRecord];
        };

        let updatedCount = 0;
        AttendanceRecord.findOneAndUpdate = async () => {
            updatedCount++;
            return null;
        };

        // Server time is 14:00 IST (08:30 UTC), well before 23:59:59 IST cutoff
        const serverTime = new Date("2026-10-14T08:30:00.000Z");
        const result = await reconcileOverdueSessions({
            serverTime,
            policy: {
                attendanceMode: "FLEXIBLE",
                timezone: "Asia/Kolkata"
            }
        });

        assert.equal(result.reconciledCount, 0);
        assert.equal(result.records.length, 0);
        assert.equal(updatedCount, 0);
    } finally {
        AttendanceRecord.find = originalFind;
        AttendanceRecord.findOneAndUpdate = originalFindOneAndUpdate;
    }
});

test("reconciliation: idempotency prevents modifying already checked-out records", async () => {
    const originalFind = AttendanceRecord.find;
    const originalFindOneAndUpdate = AttendanceRecord.findOneAndUpdate;

    try {
        const mockRecord = {
            _id: "rec_already_checked_out",
            facultyId: "FAC-TEST-003",
            date: "2026-10-13",
            checkInTime: new Date("2026-10-13T09:00:00.000Z"),
            checkOutTime: null
        };

        AttendanceRecord.find = async () => [mockRecord];

        // Simulate concurrent checkout: findOneAndUpdate returns null because checkOutTime was set
        AttendanceRecord.findOneAndUpdate = async (filter) => {
            if (filter.checkOutTime === null) {
                // If another thread already checked out, the atomic filter fails to match
                return null;
            }
            return mockRecord;
        };

        const serverTime = new Date("2026-10-14T10:00:00.000Z");
        const result = await reconcileOverdueSessions({
            serverTime,
            policy: {
                attendanceMode: "FLEXIBLE",
                timezone: "Asia/Kolkata"
            }
        });

        assert.equal(result.reconciledCount, 0);
        assert.equal(result.records.length, 0);
    } finally {
        AttendanceRecord.find = originalFind;
        AttendanceRecord.findOneAndUpdate = originalFindOneAndUpdate;
    }
});
