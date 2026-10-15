import AttendanceRecord from "../../models/AttendanceRecord.js";
import { getActiveAttendancePolicy } from "./policyService.js";
import { calculateWorkingDuration } from "../../utils/attendance/durationUtils.js";

/**
 * Creates an exact UTC Date object representing a specific local date and time
 * in the configured institutional timezone.
 *
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format
 * @param {string} timeStr - Time string in "HH:mm" or "HH:mm:ss" format
 * @param {string} timezone - IANA timezone (e.g., "Asia/Kolkata")
 * @returns {Date} Authoritative Date object in UTC
 */
export function createCutoffDate(dateStr, timeStr = "23:59:59", timezone = "Asia/Kolkata") {
    if (!dateStr) return new Date();

    const [year, month, day] = dateStr.split("-").map(Number);
    const timeParts = (timeStr || "23:59:59").split(":").map(Number);
    const hour = Number.isFinite(timeParts[0]) ? timeParts[0] : 23;
    const minute = Number.isFinite(timeParts[1]) ? timeParts[1] : 59;
    const second = Number.isFinite(timeParts[2]) ? timeParts[2] : 59;

    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone || "Asia/Kolkata",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
        });

        const parts = formatter.formatToParts(utcGuess);
        const pMap = {};
        for (const p of parts) {
            pMap[p.type] = Number(p.value);
        }
        if (pMap.hour === 24) pMap.hour = 0;

        const asLocalMs = Date.UTC(pMap.year, pMap.month - 1, pMap.day, pMap.hour, pMap.minute, pMap.second);
        const offsetMs = asLocalMs - utcGuess.getTime();
        return new Date(utcGuess.getTime() - offsetMs);
    } catch (_err) {
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
}

/**
 * Formats a Date object as "YYYY-MM-DD" in the specified timezone.
 */
export function getZonedDateString(date = new Date(), timezone = "Asia/Kolkata") {
    try {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone || "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(date);
    } catch (_err) {
        return date.toISOString().slice(0, 10);
    }
}

/**
 * Reconciles open attendance sessions that were not checked out by the faculty member.
 * Runs idempotently, safely across server restarts, and never overwrites completed checkouts.
 *
 * @param {Object} options
 * @param {Date} [options.serverTime=new Date()] - Authoritative server time
 * @param {Object} [options.policy=null] - Optional policy override (for tests/custom rules)
 * @param {string} [options.facultyId=null] - If provided, restricts reconciliation to this faculty member
 * @returns {Promise<{ reconciledCount: number, records: Array }>}
 */
export async function reconcileOverdueSessions({
    serverTime = new Date(),
    policy = null,
    facultyId = null
} = {}) {
    const activePolicy = policy || await getActiveAttendancePolicy().catch(() => null);
    const timezone = activePolicy?.timezone || "Asia/Kolkata";
    const attendanceMode = activePolicy?.attendanceMode || "FLEXIBLE";
    const currentDate = getZonedDateString(serverTime, timezone);

    // Determine cutoff time string based on policy
    let cutoffTimeStr = "23:59:59";
    if (attendanceMode === "SCHEDULED" && activePolicy?.endTime) {
        cutoffTimeStr = `${activePolicy.endTime}:00`;
    }

    // Build query for open sessions
    const query = {
        checkInTime: { $ne: null },
        checkOutTime: null
    };

    if (facultyId) {
        query.facultyId = facultyId;
    }

    const openRecords = await AttendanceRecord.find(query);
    if (!openRecords || openRecords.length === 0) {
        return {
            reconciledCount: 0,
            records: []
        };
    }

    const reconciledRecords = [];

    for (const record of openRecords) {
        const recordDate = record.date;
        const cutoffDate = createCutoffDate(recordDate, cutoffTimeStr, timezone);

        // Check if the session is overdue:
        // 1. Record is from a previous calendar day (recordDate < currentDate)
        // 2. Record is from today, but serverTime has strictly passed the cutoff time
        const isPastDay = recordDate < currentDate;
        const isPastCutoffToday = recordDate === currentDate && serverTime.getTime() >= cutoffDate.getTime();

        if (isPastDay || isPastCutoffToday) {
            // Determine effective checkout timestamp
            // If check-in happened after or at cutoff, checkout is set 1 minute after check-in
            let effectiveCheckOutTime = cutoffDate;
            if (record.checkInTime && record.checkInTime.getTime() >= cutoffDate.getTime()) {
                effectiveCheckOutTime = new Date(record.checkInTime.getTime() + 60000);
            }

            // Calculate working duration using standard formula
            const duration = calculateWorkingDuration(record.checkInTime, effectiveCheckOutTime);

            // Atomic update ensures idempotency: only updates if checkOutTime is STILL null
            const updated = await AttendanceRecord.findOneAndUpdate(
                {
                    _id: record._id,
                    checkOutTime: null
                },
                {
                    $set: {
                        checkOutTime: effectiveCheckOutTime,
                        workingDurationMinutes: duration.minutes,
                        workingDurationFormatted: duration.formatted,
                        status: "Incomplete", // Distinguishes from faculty-completed shift
                        autoClosed: true,
                        closureReason: "AUTO_CLOSED_END_OF_DAY"
                    }
                },
                { new: true }
            );

            if (updated) {
                reconciledRecords.push(updated);
            }
        }
    }

    return {
        reconciledCount: reconciledRecords.length,
        records: reconciledRecords
    };
}
