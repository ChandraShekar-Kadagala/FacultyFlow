import {
    useState
} from "react";


import NetworkForm
    from "../components/AdminNetwork/NetworkForm";


import NetworkTable
    from "../components/AdminNetwork/NetworkTable";


import {
    getNetworkLocations,
    createNetworkLocation,
    updateNetworkLocation,
    toggleNetworkLocation,
    deleteNetworkLocation,
    resetNetworkLocations
} from "../services/admin/networkService";


import {
    validateNetworkLocation
} from "../utils/admin/networkValidation";


const EMPTY_NETWORK = {

    name: "",

    building: "",

    floorArea: "",

    expectedSSID: "",

    expectedBSSIDs: [],

    allowedIPRanges: [],

    verificationMode: "COMBINED",

    active: true
};


function NetworkConfigurationPage() {

    const [
        networks,
        setNetworks
    ] = useState(
        getNetworkLocations()
    );


    const [
        network,
        setNetwork
    ] = useState(
        EMPTY_NETWORK
    );


    const [
        editingId,
        setEditingId
    ] = useState(null);


    const [
        errors,
        setErrors
    ] = useState({});


    const [
        message,
        setMessage
    ] = useState("");


    const activeNetworks =
        networks.filter(
            item => item.active
        ).length;


    function handleChange(
        field,
        value
    ) {

        setNetwork(
            current => ({
                ...current,
                [field]: value
            })
        );


        setErrors(
            current => ({
                ...current,
                [field]: undefined
            })
        );


        setMessage("");
    }


    function handleSave() {

        const validation =
            validateNetworkLocation(
                network
            );


        if (!validation.isValid) {

            setErrors(
                validation.errors
            );

            setMessage(
                "Please correct the highlighted network fields."
            );

            return;
        }


        let result;


        const cleanNetwork = {

            ...network,

            name:
                String(
                    network.name
                ).trim(),

            building:
                String(
                    network.building
                ).trim(),

            floorArea:
                String(
                    network.floorArea
                ).trim(),

            expectedSSID:
                String(
                    network.expectedSSID || ""
                ).trim(),

            expectedBSSIDs:
                (
                    network.expectedBSSIDs ||
                    []
                ).map(
                    value =>
                        String(value)
                            .trim()
                            .toLowerCase()
                ).filter(Boolean),

            allowedIPRanges:
                (
                    network.allowedIPRanges ||
                    []
                ).map(
                    value =>
                        String(value)
                            .trim()
                ).filter(Boolean),

            active:
                Boolean(
                    network.active
                )
        };


        if (editingId) {

            result =
                updateNetworkLocation(
                    editingId,
                    cleanNetwork
                );

        } else {

            result =
                createNetworkLocation(
                    cleanNetwork
                );
        }


        if (result.success) {

            setNetworks(
                getNetworkLocations()
            );


            setNetwork(
                EMPTY_NETWORK
            );


            setEditingId(
                null
            );


            setErrors({});


            setMessage(
                editingId
                    ? "Network configuration updated successfully."
                    : "Network configuration added successfully."
            );

        } else {

            setMessage(
                "Failed to save network configuration."
            );
        }
    }


    function handleEdit(
        selectedNetwork
    ) {

        setNetwork({

            ...selectedNetwork,

            expectedBSSIDs: [
                ...(
                    selectedNetwork
                        .expectedBSSIDs || []
                )
            ],

            allowedIPRanges: [
                ...(
                    selectedNetwork
                        .allowedIPRanges || []
                )
            ]
        });


        setEditingId(
            selectedNetwork.id
        );


        setErrors({});


        setMessage("");


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function handleCancel() {

        setNetwork(
            EMPTY_NETWORK
        );

        setEditingId(
            null
        );

        setErrors({});

        setMessage("");
    }


    function handleToggle(
        networkId
    ) {

        const result =
            toggleNetworkLocation(
                networkId
            );


        if (result.success) {

            setNetworks(
                result.networks
            );

            setMessage(
                "Network status updated."
            );
        }
    }


    function handleDelete(
        networkId
    ) {

        const selected =
            networks.find(
                network =>
                    network.id === networkId
            );


        if (!selected) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${selected.name}"?`
            );


        if (!confirmed) {
            return;
        }


        const result =
            deleteNetworkLocation(
                networkId
            );


        if (result.success) {

            setNetworks(
                result.networks
            );

            setMessage(
                "Network configuration deleted."
            );
        }
    }


    function handleReset() {

        const confirmed =
            window.confirm(
                "Reset all network configurations to development defaults?"
            );


        if (!confirmed) {
            return;
        }


        const result =
            resetNetworkLocations();


        if (result.success) {

            setNetworks(
                result.networks
            );

            handleCancel();

            setMessage(
                "Network configurations reset."
            );
        }
    }


    return (
        <section className="admin-dashboard">

            {/* HEADER */}

            <div className="page-header dashboard-header">

                <div>

                    <span className="eyebrow">
                        ADMIN WORKSPACE
                    </span>

                    <h1>
                        Network Configuration
                    </h1>

                    <p>
                        Configure university Wi-Fi and
                        network verification rules.
                    </p>

                </div>


                <span className="policy-status">

                    {activeNetworks}
                    {" Active"}

                </span>

            </div>


            {/* MESSAGE */}

            {message && (
                <div className="policy-message">
                    {message}
                </div>
            )}


            {/* FORM */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            NETWORK CONFIGURATION
                        </span>

                        <h2>
                            {editingId
                                ? "Edit Network"
                                : "Add Network"}
                        </h2>

                        <p>
                            Configure network signals that
                            may be evaluated by the verification layer.
                        </p>

                    </div>

                </div>


                <NetworkForm

                    network={
                        network
                    }

                    errors={
                        errors
                    }

                    editing={
                        Boolean(
                            editingId
                        )
                    }

                    onChange={
                        handleChange
                    }

                    onSave={
                        handleSave
                    }

                    onCancel={
                        handleCancel
                    }

                />

            </section>


            {/* TABLE */}

            <section className="dashboard-card">

                <div className="card-header">

                    <div>

                        <span className="card-label">
                            CONFIGURED NETWORKS
                        </span>

                        <h2>
                            University Networks
                        </h2>

                        <p>
                            Manage approved network
                            configurations and verification modes.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={
                            handleReset
                        }
                    >
                        Reset Defaults
                    </button>

                </div>


                <NetworkTable

                    networks={
                        networks
                    }

                    onEdit={
                        handleEdit
                    }

                    onToggle={
                        handleToggle
                    }

                    onDelete={
                        handleDelete
                    }

                />

            </section>


            {/* IMPORTANT PLATFORM NOTE */}

            <div className="profile-note">

                <div className="note-icon">
                    !
                </div>

                <div>

                    <strong>
                        Network verification limitation
                    </strong>

                    <p>
                        SSID, BSSID and IP configuration
                        describes the signals that the backend
                        verification service may evaluate.
                        Browser environments may not expose
                        Wi-Fi SSID/BSSID directly. FacultyFlow
                        must show unavailable signals honestly
                        rather than pretending that browser data
                        proves network presence.
                    </p>

                </div>

            </div>

        </section>
    );
}


export default NetworkConfigurationPage;