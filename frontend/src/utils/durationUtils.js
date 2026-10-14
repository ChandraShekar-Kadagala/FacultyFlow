/**
 * Authoritative duration calculation utility for FacultyFlow web frontend.
 * Synchronized with backend logic.
 */

export function calculateWorkingDuration(checkInTime, checkOutTime = null, options = {}) {
    if (!checkInTime) {
        return {
            minutes: 0,
            hours: 0,
            remainingMinutes: 0,
            formatted: "—",
            formattedCompact: "—",
            isCompleted: false,
            isOngoing: false
        };
    }

    const start = new Date(checkInTime);
    if (Number.isNaN(start.getTime())) {
        return {
            minutes: 0,
            hours: 0,
            remainingMinutes: 0,
            formatted: "—",
            formattedCompact: "—",
            isCompleted: false,
            isOngoing: false
        };
    }

    const isCompleted = Boolean(checkOutTime);
    let end;
    if (isCompleted) {
        end = new Date(checkOutTime);
        if (Number.isNaN(end.getTime())) {
            end = start;
        }
    } else {
        end = options.currentTime ? new Date(options.currentTime) : new Date();
    }

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    let formatted;
    let formattedCompact;

    if (totalMinutes === 0) {
        formatted = isCompleted ? "0 mins" : "< 1 min";
        formattedCompact = "0m";
    } else if (remainingMinutes === 0) {
        formatted = `${hours} ${hours === 1 ? "hour" : "hours"}`;
        formattedCompact = `${hours}h 00m`;
    } else if (hours === 0) {
        formatted = `${remainingMinutes} mins`;
        formattedCompact = `${remainingMinutes}m`;
    } else {
        formatted = `${hours}h ${remainingMinutes}m`;
        formattedCompact = `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
    }

    return {
        minutes: totalMinutes,
        hours,
        remainingMinutes,
        formatted,
        formattedCompact,
        isCompleted,
        isOngoing: !isCompleted
    };
}

export function formatDurationMinutes(totalMinutes) {
    if (totalMinutes === null || totalMinutes === undefined || Number.isNaN(Number(totalMinutes))) {
        return "—";
    }
    const mins = Math.max(0, Math.floor(Number(totalMinutes)));
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;

    if (mins === 0) return "0 mins";
    if (remainingMinutes === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    if (hours === 0) return `${remainingMinutes} mins`;
    return `${hours}h ${remainingMinutes}m`;
}
