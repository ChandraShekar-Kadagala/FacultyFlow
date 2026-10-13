/**
 * Validates whether the current device time falls within configured institutional attendance hours.
 */
export async function verifySchedule({
    currentTime = new Date(),
    policy = null
} = {}) {
    const startTimeStr = policy?.startTime || "00:00";
    const endTimeStr = policy?.endTime || "23:59";
    const timezone = policy?.timezone || "Asia/Kolkata";

    const now = currentTime instanceof Date ? currentTime : new Date();

    let currentMinutes = 0;
    let formattedTime = "";
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            minute: "numeric",
            hour12: false
        });
        const parts = formatter.formatToParts(now);
        let hour = 0;
        let minute = 0;
        for (const part of parts) {
            if (part.type === "hour") {
                hour = parseInt(part.value, 10);
                if (hour === 24) hour = 0;
            } else if (part.type === "minute") {
                minute = parseInt(part.value, 10);
            }
        }
        currentMinutes = hour * 60 + minute;
        formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    } catch (_err) {
        currentMinutes = now.getHours() * 60 + now.getMinutes();
        formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    const passed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

    return {
        key: "schedule",
        type: "SCHEDULE",
        label: "Institutional Attendance Window",
        status: passed ? "passed" : "failed",
        passed,
        available: true,
        reason: passed
            ? `Current time (${formattedTime}) is within permitted window (${startTimeStr} – ${endTimeStr}).`
            : `Current time (${formattedTime}) is outside permitted window (${startTimeStr} – ${endTimeStr}).`,
        diagnostics: `${formattedTime} (${timezone}, Window: ${startTimeStr} – ${endTimeStr})`
    };
}