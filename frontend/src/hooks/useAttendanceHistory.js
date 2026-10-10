import { useEffect, useState } from "react";
import { getAttendanceHistory } from "../services/api";

function useAttendanceHistory() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function loadAttendanceHistory() {
        try {
            setLoading(true);
            setError(null);

            const data =
                await getAttendanceHistory();

            setRecords(data);
        } catch (error) {
            console.error(
                "Attendance history error:",
                error
            );

            setError(
                "Unable to load attendance history."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAttendanceHistory();
    }, []);

    return {
        records,
        loading,
        error,
        refetch: loadAttendanceHistory
    };
}

export default useAttendanceHistory;