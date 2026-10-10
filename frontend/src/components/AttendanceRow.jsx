function AttendanceRow({ record }) {
    return (
        <tr>
            <td>{record.date}</td>

            <td>
                {record.status === "Present" && "✓ Present"}

                {record.status === "Late" && "⚠ Late"}

                {record.status === "Absent" && "✕ Absent"}
            </td>

            <td>
                {record.checkInTime || "-"}
            </td>

            <td>
                {record.checkOutTime || "-"}
            </td>
        </tr>
    );
}

export default AttendanceRow;