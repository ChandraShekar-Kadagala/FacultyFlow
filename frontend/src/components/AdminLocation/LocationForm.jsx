function LocationForm({
    location,
    errors,
    editing,
    onChange,
    onSave,
    onCancel
}) {

    return (
        <div className="location-form">

            <div className="location-form-grid">

                <div className="form-group">

                    <label>
                        Campus Name
                    </label>

                    <input
                        type="text"
                        placeholder="Main Campus"
                        value={location.name}
                        onChange={event =>
                            onChange(
                                "name",
                                event.target.value
                            )
                        }
                    />

                    {errors.name && (
                        <span className="form-error">
                            {errors.name}
                        </span>
                    )}

                </div>


                <div className="form-group">

                    <label>
                        Latitude
                    </label>

                    <input
                        type="number"
                        step="any"
                        placeholder="16.000000"
                        value={location.latitude}
                        onChange={event =>
                            onChange(
                                "latitude",
                                event.target.value
                            )
                        }
                    />

                    {errors.latitude && (
                        <span className="form-error">
                            {errors.latitude}
                        </span>
                    )}

                </div>


                <div className="form-group">

                    <label>
                        Longitude
                    </label>

                    <input
                        type="number"
                        step="any"
                        placeholder="80.000000"
                        value={location.longitude}
                        onChange={event =>
                            onChange(
                                "longitude",
                                event.target.value
                            )
                        }
                    />

                    {errors.longitude && (
                        <span className="form-error">
                            {errors.longitude}
                        </span>
                    )}

                </div>


                <div className="form-group">

                    <label>
                        Radius
                    </label>

                    <div className="location-radius-input">

                        <input
                            type="number"
                            min="10"
                            max="10000"
                            value={
                                location.radiusMeters
                            }
                            onChange={event =>
                                onChange(
                                    "radiusMeters",
                                    event.target.value
                                )
                            }
                        />

                        <span>
                            meters
                        </span>

                    </div>

                    <span className="form-help">
                        Allowed range: 10–10,000 meters
                    </span>

                    {errors.radiusMeters && (
                        <span className="form-error">
                            {errors.radiusMeters}
                        </span>
                    )}

                </div>

            </div>


            <label className="location-active-toggle">

                <div>

                    <strong>
                        Enable this campus
                    </strong>

                    <span>
                        Active locations can be used
                        by the location verification layer.
                    </span>

                </div>


                <input
                    type="checkbox"
                    checked={
                        Boolean(location.active)
                    }
                    onChange={event =>
                        onChange(
                            "active",
                            event.target.checked
                        )
                    }
                />

            </label>


            <div className="location-form-actions">

                {editing && (
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                )}


                <button
                    type="button"
                    className="btn-primary"
                    onClick={onSave}
                >
                    {editing
                        ? "Update Campus"
                        : "Add Campus"}
                </button>

            </div>

        </div>
    );
}

export default LocationForm;