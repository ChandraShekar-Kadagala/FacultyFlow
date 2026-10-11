import {
    useEffect,
    useState
} from "react";

import LocationForm
    from "../components/AdminLocation/LocationForm";

import LocationTable
    from "../components/AdminLocation/LocationTable";

import {
    getCampusLocations,
    createCampusLocation,
    updateCampusLocation,
    toggleCampusLocation,
    deleteCampusLocation,
    resetCampusLocations
} from "../services/admin/locationService";

import {
    validateCampusLocation
} from "../utils/admin/locationValidation";

import useAuth
    from "../hooks/useAuth";


const EMPTY_LOCATION = {
    name: "",
    latitude: "",
    longitude: "",
    radiusMeters: 250,
    active: true
};


function CampusLocationConfigurationPage() {

    const {
        accessToken
    } = useAuth();

    const [
        locations,
        setLocations
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        location,
        setLocation
    ] = useState(
        EMPTY_LOCATION
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


    async function refreshLocations() {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await getCampusLocations(accessToken);
            const list = Array.isArray(response)
                ? response
                : (response?.locations || []);
            setLocations(list);
        } catch (err) {
            console.error("Failed to load campus locations:", err);
            setMessage(
                err.message || "Failed to load campus locations from server."
            );
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        refreshLocations();
    }, [accessToken]);


    const activeLocations =
        locations.filter(
            item => item.active
        ).length;


    function handleChange(
        field,
        value
    ) {
        setLocation(
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
            validateCampusLocation(
                location
            );

        if (!validation.isValid) {
            setErrors(
                validation.errors
            );
            setMessage(
                "Please correct the highlighted fields."
            );
            return;
        }

        const payload = {
            name: String(location.name).trim(),
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            radiusMeters: Number(location.radiusMeters),
            active: Boolean(location.active)
        };

        try {
            let result;
            if (editingId) {
                result = await updateCampusLocation(
                    editingId,
                    payload,
                    accessToken
                );
            } else {
                result = await createCampusLocation(
                    payload,
                    accessToken
                );
            }

            if (result && (result.success !== false)) {
                await refreshLocations();
                setLocation(EMPTY_LOCATION);
                setEditingId(null);
                setErrors({});
                setMessage(
                    editingId
                        ? "Campus location updated successfully."
                        : "Campus location added successfully."
                );
            } else {
                setMessage(
                    result?.message || "Failed to save campus location."
                );
            }
        } catch (err) {
            console.error("Save campus location error:", err);
            setMessage(
                err.message || "Failed to save campus location."
            );
        }
    }


    function handleEdit(
        selectedLocation
    ) {
        setLocation({
            name: selectedLocation.name || "",
            latitude: String(selectedLocation.latitude ?? ""),
            longitude: String(selectedLocation.longitude ?? ""),
            radiusMeters: String(selectedLocation.radiusMeters ?? "250"),
            active: Boolean(selectedLocation.active)
        });

        setEditingId(
            selectedLocation.locationId ||
            selectedLocation.id ||
            selectedLocation._id
        );

        setErrors({});
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function handleCancel() {
        setLocation(
            EMPTY_LOCATION
        );
        setEditingId(null);
        setErrors({});
        setMessage("");
    }


    async function handleToggle(
        locationId,
        currentActive
    ) {
        try {
            await toggleCampusLocation(
                locationId,
                currentActive,
                accessToken
            );
            await refreshLocations();
            setMessage("Campus location status updated.");
        } catch (err) {
            console.error("Toggle error:", err);
            setMessage(err.message || "Failed to update location status.");
        }
    }


    async function handleDelete(
        locationId
    ) {
        const selected =
            locations.find(
                item =>
                    (item.locationId === locationId) ||
                    (item.id === locationId) ||
                    (item._id === locationId)
            );

        const name = selected ? selected.name : locationId;
        const confirmed =
            window.confirm(
                `Delete "${name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            await deleteCampusLocation(
                locationId,
                accessToken
            );
            await refreshLocations();
            setMessage("Campus location deleted.");
        } catch (err) {
            console.error("Delete error:", err);
            setMessage(err.message || "Failed to delete location.");
        }
    }


    async function handleReset() {
        const confirmed =
            window.confirm(
                "Reset campus location view to authoritative server state?"
            );

        if (!confirmed) {
            return;
        }

        try {
            await resetCampusLocations(accessToken);
            await refreshLocations();
            handleCancel();
            setMessage("Campus locations refreshed.");
        } catch (err) {
            console.error("Reset error:", err);
            setMessage(err.message || "Failed to reset locations.");
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
                        Campus & Location Configuration
                    </h1>
                    <p>
                        Configure campus coordinates,
                        geofence radius and location
                        verification availability.
                    </p>
                </div>

                <span className="policy-status">
                    {loading ? "Loading..." : `${activeLocations} Active`}
                </span>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className="policy-message">
                    {message}
                </div>
            )}

            {/* LOCATION FORM */}
            <section className="dashboard-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">
                            CAMPUS LOCATION
                        </span>
                        <h2>
                            {editingId
                                ? "Edit Campus Location"
                                : "Add Campus Location"}
                        </h2>
                        <p>
                            Define the geographic point
                            and permitted verification radius.
                        </p>
                    </div>
                </div>

                <LocationForm
                    location={location}
                    errors={errors}
                    editing={Boolean(editingId)}
                    onChange={handleChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            </section>

            {/* LOCATIONS */}
            <section className="dashboard-card">
                <div className="card-header">
                    <div>
                        <span className="card-label">
                            CONFIGURED LOCATIONS
                        </span>
                        <h2>
                            Campus Locations
                        </h2>
                        <p>
                            Manage active and inactive
                            campus verification points.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {loading ? (
                    <div className="location-empty-state">
                        <strong>Loading campus locations...</strong>
                        <p>Fetching active campus locations from MongoDB.</p>
                    </div>
                ) : (
                    <LocationTable
                        locations={locations}
                        onEdit={handleEdit}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                )}
            </section>

            {/* VERIFICATION NOTE */}
            <div className="profile-note">
                <div className="note-icon">
                    !
                </div>
                <div>
                    <strong>
                        Location verification
                    </strong>
                    <p>
                        The configured point and radius
                        describe the campus geofence.
                        Final inside/outside decisions
                        must be performed by the backend
                        verification service. The browser
                        configuration screen does not
                        claim that a coordinate alone proves
                        physical presence.
                    </p>
                </div>
            </div>

        </section>
    );
}

export default CampusLocationConfigurationPage;