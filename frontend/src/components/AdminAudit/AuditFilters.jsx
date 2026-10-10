function AuditFilters({
    filters,
    options,
    onChange,
    onReset
}) {
    return (
        <div className="audit-filter-panel">

            <div className="audit-filter-field">
                <label>Search</label>

                <input
                    type="search"
                    placeholder="Search actor, action, target..."
                    value={filters.searchTerm}
                    onChange={event =>
                        onChange(
                            "searchTerm",
                            event.target.value
                        )
                    }
                />
            </div>


            <div className="audit-filter-field">
                <label>Date</label>

                <input
                    type="date"
                    value={filters.dateFilter}
                    onChange={event =>
                        onChange(
                            "dateFilter",
                            event.target.value
                        )
                    }
                />
            </div>


            <div className="audit-filter-field">
                <label>From Date</label>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={event =>
                        onChange(
                            "startDate",
                            event.target.value
                        )
                    }
                />
            </div>


            <div className="audit-filter-field">
                <label>To Date</label>

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={event =>
                        onChange(
                            "endDate",
                            event.target.value
                        )
                    }
                />
            </div>


            <div className="audit-filter-field">
                <label>Action</label>

                <select
                    value={filters.actionFilter}
                    onChange={event =>
                        onChange(
                            "actionFilter",
                            event.target.value
                        )
                    }
                >
                    <option value="ALL">
                        All Actions
                    </option>

                    {options.actions.map(action => (
                        <option
                            key={action}
                            value={action}
                        >
                            {action}
                        </option>
                    ))}
                </select>
            </div>


            <div className="audit-filter-field">
                <label>Result</label>

                <select
                    value={filters.resultFilter}
                    onChange={event =>
                        onChange(
                            "resultFilter",
                            event.target.value
                        )
                    }
                >
                    <option value="ALL">
                        All Results
                    </option>

                    {options.results.map(result => (
                        <option
                            key={result}
                            value={result}
                        >
                            {result}
                        </option>
                    ))}
                </select>
            </div>


            <div className="audit-filter-field">
                <label>Actor</label>

                <select
                    value={filters.actorFilter}
                    onChange={event =>
                        onChange(
                            "actorFilter",
                            event.target.value
                        )
                    }
                >
                    <option value="ALL">
                        All Actors
                    </option>

                    {options.actors.map(actor => (
                        <option
                            key={actor.id}
                            value={actor.id}
                        >
                            {actor.name}
                        </option>
                    ))}
                </select>
            </div>


            <div className="audit-filter-actions">

                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onReset}
                >
                    Reset
                </button>

            </div>

        </div>
    );
}

export default AuditFilters;