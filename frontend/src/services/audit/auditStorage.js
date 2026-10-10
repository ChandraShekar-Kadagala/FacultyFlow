import {
    AUDIT_STORAGE_KEY
} from "./auditConstants";


function readAuditEvents() {

    try {

        const stored =
            localStorage.getItem(
                AUDIT_STORAGE_KEY
            );


        if (!stored) {
            return [];
        }


        const parsed =
            JSON.parse(stored);


        if (!Array.isArray(parsed)) {
            return [];
        }


        return parsed;

    } catch (error) {

        console.error(
            "Failed to read audit events:",
            error
        );

        return [];
    }
}


function writeAuditEvents(
    events
) {

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


export function saveAuditEvent(
    event
) {

    const events =
        readAuditEvents();


    events.push(event);


    return writeAuditEvents(
        events
    );
}


export function getAuditEvents() {

    return readAuditEvents();
}


export function getAuditEventById(
    eventId
) {

    if (!eventId) {
        return null;
    }


    const events =
        readAuditEvents();


    return (
        events.find(
            event =>
                event.eventId === eventId
        ) || null
    );
}


export function getAuditEventsByType(
    eventType
) {

    if (!eventType) {
        return [];
    }


    const events =
        readAuditEvents();


    return events.filter(
        event =>
            event.eventType === eventType
    );
}


export function getAuditEventsByFaculty(
    facultyId
) {

    if (!facultyId) {
        return [];
    }


    const events =
        readAuditEvents();


    return events.filter(
        event =>
            event.facultyId === facultyId
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