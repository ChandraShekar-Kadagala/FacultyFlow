function formatTimestamp(timestamp) {
    if (!timestamp) {
        return "—";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


function AuditTable({
    logs = []
}) {
    if (logs.length === 0) {
        return (
            <div className="audit-empty-state">
                <strong>
                    No audit logs found
                </strong>

                <p>
                    No audit activity matches
                    the selected filters.
                </p>
            </div>
        );
    }


    return (
        <div className="table-wrapper">

            <table className="audit-log-table">

                <thead>
                    <tr>

                        <th>
                            Timestamp
                        </th>

                        <th>
                            Actor
                        </th>

                        <th>
                            Action
                        </th>

                        <th>
                            Target
                        </th>

                        <th>
                            Result
                        </th>

                        <th>
                            Reason
                        </th>

                        <th>
                            Event ID
                        </th>

                    </tr>
                </thead>


                <tbody>

                    {logs.map(
                        (log, index) => {

                            const actorName =
                                log.actorName ||
                                log.actorId ||
                                "Unknown";

                            const action =
                                log.action ||
                                log.eventType ||
                                "UNKNOWN";

                            const result =
                                log.result ||
                                "UNKNOWN";

                            const target =
                                log.targetId
                                    ? `${log.targetType || "Target"} / ${log.targetId}`
                                    : "—";

                            const eventId =
                                log.eventId ||
                                log.id ||
                                `audit-${index}`;


                            return (
                                <tr
                                    key={eventId}
                                >

                                    <td>
                                        {formatTimestamp(
                                            log.timestamp ||
                                            log.clientTimestamp
                                        )}
                                    </td>


                                    <td>
                                        <div className="audit-actor">

                                            <span className="audit-avatar">
                                                {actorName
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>

                                            <span>
                                                {actorName}
                                            </span>

                                        </div>
                                    </td>


                                    <td>
                                        <span className="audit-action-badge">
                                            {action}
                                        </span>
                                    </td>


                                    <td>
                                        {target}
                                    </td>


                                    <td>
                                        <span
                                            className={`audit-result-badge ${result.toLowerCase()}`}
                                        >
                                            {result}
                                        </span>
                                    </td>


                                    <td>
                                        {log.reason || "—"}
                                    </td>


                                    <td>
                                        <span className="audit-event-id">
                                            {eventId}
                                        </span>
                                    </td>

                                </tr>
                            );
                        }
                    )}

                </tbody>

            </table>

        </div>
    );
}


export default AuditTable;