import { AUDIT_STORAGE_KEY } from "./auditConstants";

function readAuditEvents() {
    try {
        const storedEvents = localStorage.getItem(
            AUDIT_STORAGE_KEY
        );

        if (!storedEvents) {
            return [];
        }

        const parsedEvents = JSON.parse(storedEvents);

        if (!Array.isArray(parsedEvents)) {
            return [];
        }

        return parsedEvents;
    } catch (error) {
        console.error(
            "Failed to read audit events:",
            error
        );

        return [];
    }
}

function writeAuditEvents(events) {
    try {
        localStorage.setItem(
            AUDIT_STORAGE_KEY,
            JSON.stringify(events)
        );

        return true;
    } catch (error) {
        console.error(
            "Failed to write audit events:",
            error
        );

        return false;
    }
}

export function saveAuditEvent(event) {
    const existingEvents = readAuditEvents();

    const updatedEvents = [
        ...existingEvents,
        event
    ];

    return writeAuditEvents(updatedEvents);
}

export function getAuditEvents() {
    return readAuditEvents();
}

export function getAuditEventsByFaculty(facultyId) {
    const events = readAuditEvents();

    return events.filter(
        event => event.facultyId === facultyId
    );
}

export function getAuditEventsByType(eventType) {
    const events = readAuditEvents();

    return events.filter(
        event => event.eventType === eventType
    );
}

export function clearAuditEvents() {
    try {
        localStorage.removeItem(
            AUDIT_STORAGE_KEY
        );

        return true;
    } catch (error) {
        console.error(
            "Failed to clear audit events:",
            error
        );

        return false;
    }
}