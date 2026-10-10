import {
    useMemo,
    useState
} from "react";

import AuditFilters
    from "../components/AdminAudit/AuditFilters";

import AuditTable
    from "../components/AdminAudit/AuditTable";

import {
    getAuditViewerData,
    getAuditFilterOptions
} from "../services/admin/auditViewerService";

import {
    searchAuditLogs
} from "../services/admin/auditViewerService";


const INITIAL_FILTERS = {

    searchTerm: "",

    dateFilter: "",

    startDate: "",

    endDate: "",

    actionFilter: "ALL",

    resultFilter: "ALL",

    actorFilter: "ALL"
};


function AuditLogViewerPage() {

    const {
        logs
    } =
        useMemo(
            () =>
                getAuditViewerData(),
            []
        );


    const options =
        useMemo(
            () =>
                getAuditFilterOptions(
                    logs
                ),
            [logs]
        );


    const [
        filters,
        setFilters
    ] = useState(
        INITIAL_FILTERS
    );


    const filteredLogs =
        useMemo(
            () =>
                searchAuditLogs(
                    logs,
                    filters
                ),
            [
                logs,
                filters
            ]
        );


    function handleFilterChange(
        name,
        value
    ) {

        setFilters(
            current => ({

                ...current,

                [name]: value

            })
        );
    }


    function handleReset() {

        setFilters(
            INITIAL_FILTERS
        );
    }


    return (

        <section className="admin-dashboard">


            {/* =========================
                PAGE HEADER
            ========================= */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        SECURITY & GOVERNANCE
                    </span>

                    <h1>
                        Audit Log Viewer
                    </h1>

                    <p>
                        Review traceable
                        attendance and
                        administrative activity.
                    </p>

                </div>


                <div className="audit-result-summary">

                    <strong>
                        {
                            filteredLogs.length
                        }
                    </strong>

                    <span>
                        {
                            filteredLogs.length ===
                            1
                                ? "event"
                                : "events"
                        }
                    </span>

                </div>

            </div>


            {/* =========================
                MAIN CARD
            ========================= */}

            <section className="dashboard-card">


                <div className="card-header">

                    <div>

                        <span className="card-label">
                            AUDIT TRAIL
                        </span>

                        <h2>
                            System Activity
                        </h2>

                        <p>
                            Trace important
                            authentication,
                            attendance and
                            synchronization events.
                        </p>

                    </div>

                </div>


                {/* FILTERS */}

                <AuditFilters
                    filters={filters}
                    options={options}
                    onChange={
                        handleFilterChange
                    }
                    onReset={
                        handleReset
                    }
                />


                {/* RESULTS */}

                <div className="audit-results-bar">

                    <div>

                        <strong>
                            {
                                filteredLogs.length
                            }
                        </strong>

                        <span>
                            {
                                filteredLogs.length ===
                                1
                                    ? " matching event"
                                    : " matching events"
                            }
                        </span>

                    </div>


                    <button
                        type="button"
                        className="text-button"
                        onClick={
                            handleReset
                        }
                    >
                        Clear all filters
                    </button>

                </div>


                {/* TABLE */}

                <AuditTable
                    logs={
                        filteredLogs
                    }
                />

            </section>

        </section>
    );
}


export default AuditLogViewerPage;