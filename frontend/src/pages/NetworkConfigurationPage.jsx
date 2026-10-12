import {
    useEffect,
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

import useAuth
    from "../hooks/useAuth";


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
    const { accessToken } = useAuth();

    const [
        networks,
        setNetworks
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

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


    async function refreshNetworks() {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const list = await getNetworkLocations(accessToken);
            setNetworks(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Failed to load network configurations:", err);
            setMessage(
                err.message || "Failed to load network configurations from server."
            );
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        refreshNetworks();
    }, [accessToken]);


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


    async function handleSave() {
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

        const cleanNetwork = {
            name: String(network.name).trim(),
            building: String(network.building || "").trim(),
            floorArea: String(network.floorArea || "").trim(),
            expectedSSID: String(network.expectedSSID || "").trim(),
            expectedBSSIDs: (network.expectedBSSIDs || [])
                .map(v => String(v).trim().toUpperCase())
                .filter(Boolean),
            allowedIPRanges: (network.allowedIPRanges || [])
                .map(v => String(v).trim())
                .filter(Boolean),
            verificationMode: network.verificationMode || "COMBINED",
            active: Boolean(network.active)
        };

        try {
            let result;
            if (editingId) {
                result = await updateNetworkLocation(
                    editingId,
                    cleanNetwork,
                    accessToken
                );
            } else {
                result = await createNetworkLocation(
                    cleanNetwork,
                    accessToken
                );
            }

            if (result && result.success !== false) {
                await refreshNetworks();
                setNetwork(EMPTY_NETWORK);
                setEditingId(null);
                setErrors({});
                setMessage(
                    editingId
                        ? "Network configuration updated successfully."
                        : "Network configuration added successfully."
                );
            } else {
                setMessage("Failed to save network configuration.");
            }
        } catch (err) {
            console.error("Save network error:", err);
            setMessage(err.message || "Failed to save network configuration.");
        }
    }


    function handleEdit(selectedNetwork) {
        setNetwork({
            name: selectedNetwork.name || "",
            building: selectedNetwork.building || "",
            floorArea: selectedNetwork.floorArea || "",
            expectedSSID: selectedNetwork.expectedSSID || "",
            expectedBSSIDs: [...(selectedNetwork.expectedBSSIDs || [])],
            allowedIPRanges: [...(selectedNetwork.allowedIPRanges || [])],
            verificationMode: selectedNetwork.verificationMode || "COMBINED",
            active: Boolean(selectedNetwork.active)
        });

        setEditingId(
            selectedNetwork.networkLocationId ||
            selectedNetwork.id ||
            selectedNetwork._id
        );

        setErrors({});
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function handleCancel() {
        setNetwork(EMPTY_NETWORK);
        setEditingId(null);
        setErrors({});
        setMessage("");
    }


    async function handleToggle(networkId, currentActive) {
        try {
            await toggleNetworkLocation(
                networkId,
                !currentActive,
                accessToken
            );
            await refreshNetworks();
            setMessage("Network status updated.");
        } catch (err) {
            console.error("Toggle error:", err);
            setMessage(err.message || "Failed to update network status.");
        }
    }


    async function handleDelete(networkId) {
        const selected = networks.find(
            item =>
                (item.networkLocationId === networkId) ||
                (item.id === networkId) ||
                (item._id === networkId)
        );

        if (!selected) return;

        const confirmed = window.confirm(`Delete "${selected.name}"?`);
        if (!confirmed) return;

        try {
            await deleteNetworkLocation(networkId, accessToken);
            await refreshNetworks();
            if (editingId === networkId) {
                handleCancel();
            }
            setMessage("Network configuration deleted successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            setMessage(err.message || "Failed to delete network configuration.");
        }
    }


    function handleReset() {
        const confirmed = window.confirm(
            "Reset network configuration to default university settings?"
        );
        if (!confirmed) return;

        resetNetworkLocations();
        refreshNetworks();
        setNetwork(EMPTY_NETWORK);
        setEditingId(null);
        setErrors({});
        setMessage("Network configuration reset to defaults.");
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
                        Configure university Wi-Fi SSIDs, access-point BSSIDs and IP ranges for attendance verification.
                    </p>
                </div>
            </div>

            {/* STATUS MESSAGE */}
            {message && (
                <div className="network-message" role="status">
                    {message}
                </div>
            )}

            {/* KPI STATS */}
            <div className="dashboard-summary-grid">
                <div className="summary-card">
                    <div className="summary-icon blue">
                        📶
                    </div>
                    <div>
                        <span>Total Networks</span>
                        <strong>{networks.length}</strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon green">
                        ✓
                    </div>
                    <div>
                        <span>Active Networks</span>
                        <strong>{activeNetworks}</strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon purple">
                        🏢
                    </div>
                    <div>
                        <span>Buildings</span>
                        <strong>
                            {new Set(networks.map(n => n.building).filter(Boolean)).size}
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon amber">
                        🔒
                    </div>
                    <div>
                        <span>Mode</span>
                        <strong>Multi-Factor</strong>
                    </div>
                </div>
            </div>

            {/* FORM */}
            <section className="dashboard-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">
                            {editingId ? "EDIT NETWORK" : "NEW NETWORK"}
                        </span>
                        <h2>
                            {editingId ? "Edit Network Configuration" : "Add Campus Network"}
                        </h2>
                        <p>
                            Configure network verification parameters. Configured values are expected verification signals.
                        </p>
                    </div>
                </div>

                <NetworkForm
                    network={network}
                    errors={errors}
                    editing={Boolean(editingId)}
                    onChange={handleChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
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
                            Network Roster
                        </h2>
                        <p>
                            Active networks evaluated by the backend attendance verification service.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleReset}
                    >
                        Reset to Defaults
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <p>Loading network configurations...</p>
                    </div>
                ) : (
                    <NetworkTable
                        networks={networks}
                        onEdit={handleEdit}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                )}
            </section>
        </section>
    );
}

export default NetworkConfigurationPage;