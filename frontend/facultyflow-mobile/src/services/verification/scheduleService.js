/**
 * Validates whether the current device time falls within configured institutional attendance hours.
 */
export async function verifySchedule({
    currentTime = new Date(),
    policy = null
} = {}) {
    const startTimeStr = policy?.startTime || "00:00";
    const endTimeStr = policy?.endTime || "23:59";

    const now = currentTime instanceof Date ? currentTime : new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    const passed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

    const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
        key: "schedule",
        type: "SCHEDULE",
        label: "Institutional Attendance Window",
        status: passed ? "passed" : "failed",
        passed,
        available: true,
        reason: passed
            ? `Current time (${formattedTime}) is within permitted window (${startTimeStr} - ${endTimeStr}).`
            : `Current time (${formattedTime}) is outside permitted window (${startTimeStr} - ${endTimeStr}).`,
        diagnostics: `${formattedTime} (Permitted: ${startTimeStr} – ${endTimeStr})`
    };
}