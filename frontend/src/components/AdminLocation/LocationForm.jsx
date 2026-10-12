import { useState } from "react";
import {
    getCurrentBrowserLocation,
    isBrowserLocationSupported
} from "../../services/location/browserLocation";

function LocationForm({
    location,
    errors,
    editing,
    onChange,
    onSave,
    onCancel
}) {
    const [locating, setLocating] = useState(false);
    const [locatingStatus, setLocatingStatus] = useState("");
    const [locatingError, setLocatingError] = useState("");

    async function handleUseCurrentLocation() {
        setLocating(true);
        setLocatingError("");
        setLocatingStatus("");

        if (!isBrowserLocationSupported()) {
            setLocating(false);
            setLocatingError(
                "Browser location services are not supported or available in this environment."
            );
            return;
        }

        try {
            const coords = await getCurrentBrowserLocation();
            onChange("latitude", coords.latitude.toFixed(6));
            onChange("longitude", coords.longitude.toFixed(6));
            setLocatingStatus(
                `Current device coordinates loaded (accuracy ±${coords.accuracyMeters ? Math.round(coords.accuracyMeters) : 10}m). Review and edit if needed.`
            );
        } catch (err) {
            setLocatingError(
                err.message || "Failed to retrieve current device location."
            );
        } finally {
            setLocating(false);
        }
    }

    const hasCoordinates =
        location.latitude !== "" &&
        location.longitude !== "" &&
        !isNaN(Number(location.latitude)) &&
        !isNaN(Number(location.longitude));

    return (
        <div className="location-form">
            {/* CURRENT LOCATION ACTION BANNER */}
            <div className="location-detect-bar">
                <div>
                    <strong>Auto-fill from device GPS</strong>
                    <p>
                        Retrieve your device's current coordinates. Note: Device location is an administrative convenience and may differ from the official university campus center.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn-secondary location-detect-btn"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                >
                    {locating ? "Detecting GPS..." : "📍 Use Current Location"}
                </button>
            </div>

            {locatingStatus && (
                <div className="location-detect-message success" role="status">
                    ✓ {locatingStatus}
                </div>
            )}

            {locatingError && (
                <div className="location-detect-message error" role="alert">
                    ! {locatingError}
                </div>
            )}

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

            {/* GEOFENCE PREVIEW */}
            {hasCoordinates && (
                <div className="location-geofence-preview">
                    <div className="geofence-preview-header">
                        <span className="geofence-badge">GEOFENCE PREVIEW</span>
                        <span className="geofence-coords">
                            {Number(location.latitude).toFixed(6)}°, {Number(location.longitude).toFixed(6)}°
                        </span>
                    </div>
                    <div className="geofence-metrics">
                        <div>
                            <span>Perimeter Radius</span>
                            <strong>{location.radiusMeters || 250} meters</strong>
                        </div>
                        <div>
                            <span>Estimated Area</span>
                            <strong>
                                ~{(Math.PI * Math.pow(Number(location.radiusMeters || 250) / 1000, 2)).toFixed(3)} km²
                            </strong>
                        </div>
                        <div>
                            <span>Verification Logic</span>
                            <strong>Haversine Server-Side Math</strong>
                        </div>
                    </div>
                </div>
            )}


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