const API_BASE_URL = "/mock";

export async function getAttendanceHistory() {
    const response = await fetch(
        `${API_BASE_URL}/attendance.json`
    );

    if (!response.ok) {
        throw new Error(
            "Failed to fetch attendance history"
        );
    }

    const data = await response.json();

    return data.records;
}