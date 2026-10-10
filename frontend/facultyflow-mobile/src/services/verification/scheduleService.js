export async function verifySchedule({
    currentTime,
    startTime = "09:30",
    endTime = "17:00"
}) {
    if (!currentTime) {
        return {
            key: "schedule",
            label: "Schedule & Time",
            status: "failed",
            passed: false,
            available: true,
            reason: "Current time is unavailable."
        };
    }

    const currentMinutes =
        currentTime.hours * 60 +
        currentTime.minutes;

    const [startHour, startMinute] =
        startTime.split(":").map(Number);

    const [endHour, endMinute] =
        endTime.split(":").map(Number);

    const startMinutes =
        startHour * 60 +
        startMinute;

    const endMinutes =
        endHour * 60 +
        endMinute;

    const passed =
        currentMinutes >= startMinutes &&
        currentMinutes <= endMinutes;

    return {
        key: "schedule",
        label: "Schedule & Time",
        status: passed ? "passed" : "failed",
        passed,
        available: true,
        reason: passed
            ? null
            : "Current time is outside the configured attendance window."
    };
}