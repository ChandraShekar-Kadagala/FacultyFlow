import { useState } from "react";

function NetworkForm({
    network,
    errors,
    editing,
    onChange,
    onSave,
    onCancel
}) {
    const [detecting, setDetecting] = useState(false);
    const [detectionInfo, setDetectionInfo] = useState(null);

    function updateListField(
        field,
        value
    ) {
        const values =
            value
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

        onChange(
            field,
            values
        );
    }

    function handleDetectNetwork() {
        setDetecting(true);

        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
        const connection = typeof navigator !== "undefined"
            ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection)
            : null;

        const detectedType = connection?.type || connection?.effectiveType || (isOnline ? "broadband/wifi" : "offline");
        const downlink = connection?.downlink ? `${connection.downlink} Mbps` : null;

        setTimeout(() => {
            setDetecting(false);
            setDetectionInfo({
                online: isOnline,
                connectionType: detectedType,
                downlink,
                note: "Browser security sandboxes strictly prevent web pages from querying low-level Wi-Fi SSID and access point BSSID (MAC addresses) to protect user location and device privacy. Please specify expected university Wi-Fi SSID and AP BSSIDs manually below."
            });
        }, 350);
    }

    const bssidText =
        (
            network.expectedBSSIDs || []
        ).join(", ");

    const ipRangeText =
        (
            network.allowedIPRanges || []
        ).join(", ");

    return (
        <div className="network-form">
            {/* NETWORK DETECTION ACTION BAR */}
            <div className="location-detect-bar">
                <div>
                    <strong>Network Environment Diagnostics</strong>
                    <p>
                        Inspect the current client connection. Note: Standard web browsers cannot read Wi-Fi SSID or BSSID for security reasons.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn-secondary location-detect-btn"
                    onClick={handleDetectNetwork}
                    disabled={detecting}
                >
                    {detecting ? "Inspecting network..." : "📶 Detect Current Network"}
                </button>
            </div>

            {detectionInfo && (
                <div className="network-detection-banner">
                    <div className="detection-banner-header">
                        <span className="geofence-badge">
                            {detectionInfo.online ? "ONLINE" : "OFFLINE"}
                        </span>
                        <span className="detection-type">
                            Link: {detectionInfo.connectionType} {detectionInfo.downlink ? `(${detectionInfo.downlink})` : ""}
                        </span>
                    </div>
                    <p className="detection-note">
                        ℹ️ {detectionInfo.note}
                    </p>
                </div>
            )}

            <div className="network-form-grid">
                {/* NAME */}


                <div className="form-group">

                    <label>
                        Network Name
                    </label>

                    <input
                        type="text"
                        placeholder="Main Campus Wi-Fi"
                        value={
                            network.name
                        }
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


                {/* BUILDING */}

                <div className="form-group">

                    <label>
                        Building
                    </label>

                    <input
                        type="text"
                        placeholder="Main Campus"
                        value={
                            network.building
                        }
                        onChange={event =>
                            onChange(
                                "building",
                                event.target.value
                            )
                        }
                    />

                    {errors.building && (
                        <span className="form-error">
                            {errors.building}
                        </span>
                    )}

                </div>


                {/* FLOOR */}

                <div className="form-group">

                    <label>
                        Floor / Area
                    </label>

                    <input
                        type="text"
                        placeholder="Ground Floor"
                        value={
                            network.floorArea
                        }
                        onChange={event =>
                            onChange(
                                "floorArea",
                                event.target.value
                            )
                        }
                    />

                    {errors.floorArea && (
                        <span className="form-error">
                            {errors.floorArea}
                        </span>
                    )}

                </div>


                {/* MODE */}

                <div className="form-group">

                    <label>
                        Verification Mode
                    </label>

                    <select
                        value={
                            network.verificationMode
                        }
                        onChange={event =>
                            onChange(
                                "verificationMode",
                                event.target.value
                            )
                        }
                    >

                        <option value="SSID">
                            SSID
                        </option>

                        <option value="BSSID">
                            BSSID
                        </option>

                        <option value="IP_RANGE">
                            IP Range
                        </option>

                        <option value="COMBINED">
                            Combined
                        </option>

                    </select>

                    <span className="form-help">
                        Combined uses configured BSSID/IP
                        signals where available.
                    </span>

                </div>

            </div>


            {/* SSID */}

            <div className="form-group">

                <label>
                    Expected SSID
                </label>

                <input
                    type="text"
                    placeholder="UNIVERSITY_WIFI"
                    value={
                        network.expectedSSID
                    }
                    onChange={event =>
                        onChange(
                            "expectedSSID",
                            event.target.value
                        )
                    }
                />

                <span className="form-help">
                    Network name exposed by the
                    supported client platform.
                </span>

                {errors.expectedSSID && (
                    <span className="form-error">
                        {errors.expectedSSID}
                    </span>
                )}

            </div>


            {/* BSSID */}

            <div className="form-group">

                <label>
                    Expected BSSID(s)
                </label>

                <textarea
                    rows="3"
                    placeholder="AA:BB:CC:DD:EE:FF, 11:22:33:44:55:66"
                    value={
                        bssidText
                    }
                    onChange={event =>
                        updateListField(
                            "expectedBSSIDs",
                            event.target.value
                        )
                    }
                />

                <span className="form-help">
                    Enter multiple access-point BSSIDs
                    separated by commas.
                </span>

                {errors.expectedBSSIDs && (
                    <span className="form-error">
                        {errors.expectedBSSIDs}
                    </span>
                )}

            </div>


            {/* IP */}

            <div className="form-group">

                <label>
                    Allowed IP Range(s)
                </label>

                <textarea
                    rows="3"
                    placeholder="10.20.0.0/16, 192.168.1.0/24"
                    value={
                        ipRangeText
                    }
                    onChange={event =>
                        updateListField(
                            "allowedIPRanges",
                            event.target.value
                        )
                    }
                />

                <span className="form-help">
                    IPv4 addresses or CIDR ranges,
                    separated by commas.
                </span>

                {errors.allowedIPRanges && (
                    <span className="form-error">
                        {errors.allowedIPRanges}
                    </span>
                )}

            </div>


            {errors.combined && (
                <span className="form-error">
                    {errors.combined}
                </span>
            )}


            {/* ACTIVE */}

            <label className="network-active-toggle">

                <div>

                    <strong>
                        Enable this network
                    </strong>

                    <span>
                        Active networks may be considered
                        by the verification service.
                    </span>

                </div>


                <input
                    type="checkbox"
                    checked={
                        Boolean(
                            network.active
                        )
                    }
                    onChange={event =>
                        onChange(
                            "active",
                            event.target.checked
                        )
                    }
                />

            </label>


            {/* ACTIONS */}

            <div className="network-form-actions">

                {editing && (
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={
                            onCancel
                        }
                    >
                        Cancel
                    </button>
                )}


                <button
                    type="button"
                    className="btn-primary"
                    onClick={
                        onSave
                    }
                >
                    {editing
                        ? "Update Network"
                        : "Add Network"}
                </button>

            </div>

        </div>
    );
}


export default NetworkForm;