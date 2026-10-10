function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}


export function filterAuditLogs({
    logs = [],
    searchTerm = "",
    dateFilter = "",
    startDate = "",
    endDate = "",
    actionFilter = "ALL",
    resultFilter = "ALL",
    actorFilter = "ALL"
}) {

    const search =
        normalize(searchTerm);

    return logs.filter(
        log => {

            const actorName =
                log.actorName ||
                log.actorId ||
                "";

            const action =
                log.action ||
                log.eventType ||
                "";

            const result =
                log.result ||
                "UNKNOWN";

            const timestamp =
                log.timestamp ||
                log.clientTimestamp ||
                "";

            const logDate =
                String(timestamp)
                    .split("T")[0];


            const matchesSearch =
                !search ||
                normalize(actorName)
                    .includes(search) ||
                normalize(log.actorId)
                    .includes(search) ||
                normalize(action)
                    .includes(search) ||
                normalize(log.targetType)
                    .includes(search) ||
                normalize(log.targetId)
                    .includes(search) ||
                normalize(log.reason)
                    .includes(search);


            const matchesDate =
                !dateFilter ||
                logDate === dateFilter;


            const matchesStartDate =
                !startDate ||
                logDate >= startDate;


            const matchesEndDate =
                !endDate ||
                logDate <= endDate;


            const matchesAction =
                actionFilter === "ALL" ||
                action === actionFilter;


            const matchesResult =
                resultFilter === "ALL" ||
                result === resultFilter;


            const matchesActor =
                actorFilter === "ALL" ||
                log.actorId === actorFilter;


            return (
                matchesSearch &&
                matchesDate &&
                matchesStartDate &&
                matchesEndDate &&
                matchesAction &&
                matchesResult &&
                matchesActor
            );
        }
    );
}


export function getUniqueAuditActions(
    logs = []
) {

    return [
        ...new Set(
            logs
                .map(
                    log =>
                        log.action ||
                        log.eventType
                )
                .filter(Boolean)
        )
    ].sort();
}


export function getUniqueAuditResults(
    logs = []
) {

    return [
        ...new Set(
            logs
                .map(
                    log =>
                        log.result ||
                        "UNKNOWN"
                )
                .filter(Boolean)
        )
    ].sort();
}


export function getUniqueAuditActors(
    logs = []
) {

    return [
        ...new Set(
            logs
                .map(
                    log =>
                        log.actorId
                )
                .filter(Boolean)
        )
    ].sort();
}