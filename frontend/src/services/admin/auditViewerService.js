import {
    getAllAuditEvents
} from "../audit/auditService";

import {
    filterAuditLogs,
    getUniqueAuditActions,
    getUniqueAuditResults,
    getUniqueAuditActors
} from "../../utils/admin/auditFilters";


export function getAuditViewerData() {

    let logs = [];

    try {
        logs = getAllAuditEvents();

        if (!Array.isArray(logs)) {
            logs = [];
        }

    } catch (error) {

        console.error(
            "Failed to load audit logs:",
            error
        );

        logs = [];
    }


    return {
        logs
    };
}


export function getAuditFilterOptions(
    logs = []
) {

    return {
        actions:
            getUniqueAuditActions(logs),

        results:
            getUniqueAuditResults(logs),

        actors:
            getUniqueAuditActors(logs)
    };
}


export function searchAuditLogs(
    logs = [],
    filters = {}
) {

    return filterAuditLogs({
        logs,
        ...filters
    });
}