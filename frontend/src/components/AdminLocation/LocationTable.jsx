import LocationStatus
    from "./LocationStatus";


function LocationTable({
    locations,
    onEdit,
    onToggle,
    onDelete
}) {

    if (locations.length === 0) {

        return (
            <div className="location-empty-state">

                <strong>
                    No campus locations configured
                </strong>

                <p>
                    Add a campus location to enable
                    location configuration.
                </p>

            </div>
        );
    }


    return (
        <div className="table-wrapper">

            <table className="location-table">

                <thead>

                    <tr>

                        <th>
                            Campus
                        </th>

                        <th>
                            Latitude
                        </th>

                        <th>
                            Longitude
                        </th>

                        <th>
                            Radius
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {locations.map(
                        location => {
                            const id = location.locationId || location.id || location._id;
                            return (
                                <tr
                                    key={id}
                                >
                                    <td>
                                        <div className="location-name">
                                            <div className="location-icon">
                                                📍
                                            </div>
                                            <div>
                                                <strong>
                                                    {location.name}
                                                </strong>
                                                <span>
                                                    {id}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {Number(
                                            location.latitude
                                        ).toFixed(6)}
                                    </td>

                                    <td>
                                        {Number(
                                            location.longitude
                                        ).toFixed(6)}
                                    </td>

                                    <td>
                                        {location.radiusMeters}
                                        {" m"}
                                    </td>

                                    <td>
                                        <LocationStatus
                                            active={
                                                location.active
                                            }
                                        />
                                    </td>

                                    <td>
                                        <div className="location-actions">
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() =>
                                                    onEdit(
                                                        location
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() =>
                                                    onToggle(
                                                        id,
                                                        location.active
                                                    )
                                                }
                                            >
                                                {location.active
                                                    ? "Disable"
                                                    : "Enable"}
                                            </button>

                                            <button
                                                type="button"
                                                className="location-delete-button"
                                                onClick={() =>
                                                    onDelete(
                                                        id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
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

export default LocationTable;