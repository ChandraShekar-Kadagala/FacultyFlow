const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL;

export async function syncAttendanceEvent(event) {
    if (!API_BASE_URL) {
        throw new Error(
            "EXPO_PUBLIC_API_URL is not configured"
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/api/sync/events`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                eventId: event.eventId,
                eventType: event.eventType,
                facultyId: event.facultyId,
                attendance: event.attendance,
                verification: event.verification,
                createdAt: event.createdAt
            })
        }
    );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message ||
            `Server returned ${response.status}`
        );
    }

    return response.json();
}