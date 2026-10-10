import {
    SECURITY_STORAGE_KEYS
} from "../../utils/security/securityConstants";

import {
    sanitizeId,
    sanitizeReason
} from "../../utils/security/sanitizeSecurityInput";


function readEvents() {
    try {
        const stored =
            localStorage.getItem(
                SECURITY_STORAGE_KEYS
                    .SECURITY_EVENTS
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {
        return [];
    }
}


function saveEvents(events) {
    try {
        localStorage.setItem(
            SECURITY_STORAGE_KEYS
                .SECURITY_EVENTS,
            JSON.stringify(events)
        );

        return true;

    } catch {
        return false;
    }
}


export function recordSecurityEvent({
    eventType,
    result,
    actorId = null,
    route = "",
    reason = ""
}) {
    const event = {
        eventId:
            `SEC-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        eventType,

        result,

        actorId:
            sanitizeId(actorId),

        route:
            sanitizeReason(route),

        reason:
            sanitizeReason(reason),

        timestamp:
            new Date().toISOString()
    };

    const events =
        readEvents();

    events.push(event);

    const limitedEvents =
        events.slice(-500);

    saveEvents(
        limitedEvents
    );

    return event;
}


export function getSecurityEvents() {
    return readEvents();
}


export function clearSecurityEvents() {
    try {
        localStorage.removeItem(
            SECURITY_STORAGE_KEYS
                .SECURITY_EVENTS
        );

        return true;

    } catch {
        return false;
    }
}