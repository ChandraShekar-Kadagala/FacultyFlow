import NetworkStatus
    from "./NetworkStatus";


function NetworkTable({
    networks,
    onEdit,
    onToggle,
    onDelete
}) {

    if (networks.length === 0) {

        return (
            <div className="network-empty-state">

                <strong>
                    No network locations configured
                </strong>

                <p>
                    Add a university network configuration
                    to enable network verification rules.
                </p>

            </div>
        );
    }


    return (
        <div className="table-wrapper">

            <table className="network-table">

                <thead>

                    <tr>

                        <th>
                            Network
                        </th>

                        <th>
                            Location
                        </th>

                        <th>
                            SSID
                        </th>

                        <th>
                            BSSIDs
                        </th>

                        <th>
                            IP Ranges
                        </th>

                        <th>
                            Mode
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

                    {networks.map(
                        network => (

                            <tr
                                key={
                                    network.id
                                }
                            >

                                <td>

                                    <div className="network-name">

                                        <div className="network-icon">
                                            Wi
                                        </div>

                                        <div>

                                            <strong>
                                                {network.name}
                                            </strong>

                                            <span>
                                                {network.id}
                                            </span>

                                        </div>

                                    </div>

                                </td>


                                <td>

                                    <div className="network-location">

                                        <strong>
                                            {network.building}
                                        </strong>

                                        <span>
                                            {network.floorArea}
                                        </span>

                                    </div>

                                </td>


                                <td>
                                    {network.expectedSSID ||
                                        "—"}
                                </td>


                                <td>
                                    {(
                                        network.expectedBSSIDs ||
                                        []
                                    ).length}
                                </td>


                                <td>
                                    {(
                                        network.allowedIPRanges ||
                                        []
                                    ).length}
                                </td>


                                <td>

                                    <span className="network-mode">
                                        {
                                            network.verificationMode
                                        }
                                    </span>

                                </td>


                                <td>

                                    <NetworkStatus
                                        active={
                                            network.active
                                        }
                                    />

                                </td>


                                <td>

                                    <div className="network-actions">

                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() =>
                                                onEdit(
                                                    network
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
                                                    network.id
                                                )
                                            }
                                        >
                                            {network.active
                                                ? "Disable"
                                                : "Enable"}
                                        </button>


                                        <button
                                            type="button"
                                            className="network-delete-button"
                                            onClick={() =>
                                                onDelete(
                                                    network.id
                                                )
                                            }
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        )
                    )}

                </tbody>

            </table>

        </div>
    );
}


export default NetworkTable;