import {
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


const EMPTY_LOCATION = {
    name: "",
    latitude: "",
    longitude: "",
    radiusMeters: 250,
    active: true
};


function CampusLocationConfigurationPage() {

    const [
        locations,
        setLocations
    ] = useState(
        getCampusLocations()
    );


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


    function handleSave() {

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


        let result;


        if (editingId) {

            result =
                updateCampusLocation(
                    editingId,
                    {
                        name:
                            String(
                                location.name
                            ).trim(),

                        latitude:
                            Number(
                                location.latitude
                            ),

                        longitude:
                            Number(
                                location.longitude
                            ),

                        radiusMeters:
                            Number(
                                location.radiusMeters
                            ),

                        active:
                            Boolean(
                                location.active
                            )
                    }
                );

        } else {

            result =
                createCampusLocation(
                    location
                );
        }


        if (result.success) {

            setLocations(
                getCampusLocations()
            );

            setLocation(
                EMPTY_LOCATION
            );

            setEditingId(null);

            setErrors({});

            setMessage(
                editingId
                    ? "Campus location updated successfully."
                    : "Campus location added successfully."
            );

        } else {

            setMessage(
                "Failed to save campus location."
            );
        }
    }


    function handleEdit(
        selectedLocation
    ) {

        setLocation({
            ...selectedLocation,

            latitude:
                String(
                    selectedLocation.latitude
                ),

            longitude:
                String(
                    selectedLocation.longitude
                ),

            radiusMeters:
                String(
                    selectedLocation.radiusMeters
                )
        });


        setEditingId(
            selectedLocation.id
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


    function handleToggle(
        locationId
    ) {

        const result =
            toggleCampusLocation(
                locationId
            );


        if (result.success) {

            setLocations(
                result.locations
            );

            setMessage(
                "Campus location status updated."
            );
        }
    }


    function handleDelete(
        locationId
    ) {

        const selected =
            locations.find(
                item =>
                    item.id === locationId
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
            deleteCampusLocation(
                locationId
            );


        if (result.success) {

            setLocations(
                result.locations
            );

            setMessage(
                "Campus location deleted."
            );
        }
    }


    function handleReset() {

        const confirmed =
            window.confirm(
                "Reset all campus locations to the development defaults?"
            );


        if (!confirmed) {
            return;
        }


        const result =
            resetCampusLocations();


        if (result.success) {

            setLocations(
                result.locations
            );

            handleCancel();

            setMessage(
                "Campus locations reset."
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
                        Campus & Location Configuration
                    </h1>

                    <p>
                        Configure campus coordinates,
                        geofence radius and location
                        verification availability.
                    </p>

                </div>


                <span className="policy-status">

                    {activeLocations}
                    {" Active"}

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

                    location={
                        location
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
                        onClick={
                            handleReset
                        }
                    >
                        Reset Defaults
                    </button>

                </div>


                <LocationTable

                    locations={
                        locations
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