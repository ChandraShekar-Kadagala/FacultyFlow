function escapeCSVValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const stringValue =
        String(value);

    return `"${stringValue.replace(
        /"/g,
        '""'
    )}"`;
}

export function convertToCSV(
    rows
) {
    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {
        return "";
    }

    const headers = Object.keys(
        rows[0]
    );

    const headerRow =
        headers
            .map(escapeCSVValue)
            .join(",");

    const dataRows = rows.map(row =>
        headers
            .map(header =>
                escapeCSVValue(
                    row[header]
                )
            )
            .join(",")
    );

    return [
        headerRow,
        ...dataRows
    ].join("\n");
}

export function downloadCSV(
    rows,
    filename = "facultyflow-report.csv"
) {
    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {
        return false;
    }

    const csv =
        convertToCSV(rows);

    const blob = new Blob(
        [csv],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return true;
}

export function buildAttendanceCSVRows(
    records
) {
    return records.map(record => ({
        Faculty:
            record.facultyName || "",

        "Employee Code":
            record.employeeCode || "",

        Department:
            record.department || "",

        Date:
            record.date || "",

        "Check In":
            record.checkInTime || "",

        "Check Out":
            record.checkOutTime || "",

        Status:
            record.status || "",

        Verification:
            record.verificationStatus ||
            "Pending"
    }));
}