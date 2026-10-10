import {
    useMemo,
    useState
} from "react";

import ReportFilters
    from "../components/AdminReports/ReportFilters";

import ReportSummary
    from "../components/AdminReports/ReportSummary";

import ReportTable
    from "../components/AdminReports/ReportTable";

import {
    getAttendanceReport,
    getDepartments,
    getFacultyOptions,
    getAvailableStatuses
} from "../services/admin/reportService";

import {
    calculateReportSummary,
    getReportPeriodLabel
} from "../utils/admin/reportCalculations";

import {
    buildAttendanceCSVRows,
    downloadCSV
} from "../utils/admin/csvExport";


const initialFilters = {
    reportType: "CUSTOM",
    fromDate: "",
    toDate: "",
    facultyId: "ALL",
    department: "ALL",
    status: "ALL"
};


function ReportsPage() {

    const [
        filters,
        setFilters
    ] = useState(initialFilters);

    const departments =
        useMemo(
            () =>
                getDepartments(),
            []
        );

    const facultyOptions =
        useMemo(
            () =>
                getFacultyOptions(),
            []
        );

    const statuses =
        useMemo(
            () =>
                getAvailableStatuses(),
            []
        );

    const records =
        useMemo(
            () =>
                getAttendanceReport(
                    filters
                ),
            [filters]
        );

    const summary =
        useMemo(
            () =>
                calculateReportSummary(
                    records
                ),
            [records]
        );

    const periodLabel =
        getReportPeriodLabel(
            filters.reportType,
            filters.fromDate,
            filters.toDate
        );

    function handleReset() {
        setFilters(
            initialFilters
        );
    }

    function handleExport() {

        if (!records.length) {
            window.alert(
                "There are no records to export."
            );

            return;
        }

        const rows =
            buildAttendanceCSVRows(
                records
            );

        const today =
            new Date()
                .toISOString()
                .slice(0, 10);

        const filename =
            `facultyflow-attendance-report-${today}.csv`;

        downloadCSV(
            rows,
            filename
        );
    }

    return (
        <section className="admin-dashboard">

            {/* HEADER */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        ADMIN REPORTING
                    </span>

                    <h1>
                        Reports & Export
                    </h1>

                    <p>
                        Generate attendance
                        summaries and export
                        report data.
                    </p>

                </div>

                <div className="report-header-actions">

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={
                            handleExport
                        }
                        disabled={
                            !records.length
                        }
                    >
                        Export CSV
                    </button>

                </div>

            </div>


            {/* FILTERS */}

            <ReportFilters
                filters={filters}
                setFilters={setFilters}
                departments={
                    departments
                }
                facultyOptions={
                    facultyOptions
                }
                statuses={
                    statuses
                }
                onReset={
                    handleReset
                }
            />


            {/* PERIOD */}

            <section className="report-period-card">

                <div>

                    <span>
                        REPORT PERIOD
                    </span>

                    <strong>
                        {periodLabel}
                    </strong>

                </div>

                <div>

                    <span>
                        RECORDS
                    </span>

                    <strong>
                        {records.length}
                    </strong>

                </div>

            </section>


            {/* SUMMARY */}

            <ReportSummary
                summary={summary}
            />


            {/* TABLE */}

            <ReportTable
                records={records}
            />

        </section>
    );
}

export default ReportsPage;