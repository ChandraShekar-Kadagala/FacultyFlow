import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
    PENDING_EVENTS: "@facultyflow/pending_events",
    ATTENDANCE_EVENTS: "@facultyflow/attendance_events"
};

async function readJSON(key, fallback) {
    try {
        const value = await AsyncStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);
    } catch (error) {
        console.error("Storage read error:", error);
        return fallback;
    }
}

async function writeJSON(key, value) {
    try {
        await AsyncStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error("Storage write error:", error);
        return false;
    }
}

export async function getPendingEvents() {
    return readJSON(
        STORAGE_KEYS.PENDING_EVENTS,
        []
    );
}

export async function savePendingEvents(events) {
    return writeJSON(
        STORAGE_KEYS.PENDING_EVENTS,
        events
    );
}

export async function getAttendanceEvents() {
    return readJSON(
        STORAGE_KEYS.ATTENDANCE_EVENTS,
        []
    );
}

export async function saveAttendanceEvents(events) {
    return writeJSON(
        STORAGE_KEYS.ATTENDANCE_EVENTS,
        events
    );
}

export async function addAttendanceEvent(event) {
    const events = await getAttendanceEvents();

    const exists = events.some(
        item => item.eventId === event.eventId
    );

    if (exists) {
        return events;
    }

    const updatedEvents = [
        ...events,
        event
    ];

    await saveAttendanceEvents(updatedEvents);

    return updatedEvents;
}

export async function addPendingEvent(event) {
    const events = await getPendingEvents();

    const exists = events.some(
        item => item.eventId === event.eventId
    );

    if (exists) {
        return events;
    }

    const updatedEvents = [
        ...events,
        event
    ];

    await savePendingEvents(updatedEvents);

    return updatedEvents;
}

export async function removePendingEvent(eventId) {
    const events = await getPendingEvents();

    const updatedEvents = events.filter(
        event => event.eventId !== eventId
    );

    await savePendingEvents(updatedEvents);

    return updatedEvents;
}

export async function updatePendingEvent(
    eventId,
    updates
) {
    const events = await getPendingEvents();

    const updatedEvents = events.map(event => {
        if (event.eventId !== eventId) {
            return event;
        }

        return {
            ...event,
            ...updates
        };
    });

    await savePendingEvents(updatedEvents);

    return updatedEvents;
}

export async function clearAllPendingEvents() {
    await savePendingEvents([]);

    return true;
}

export { STORAGE_KEYS };