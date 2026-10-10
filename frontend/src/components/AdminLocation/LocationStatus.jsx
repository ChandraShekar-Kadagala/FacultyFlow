function LocationStatus({
    active
}) {

    return (
        <span
            className={
                `location-status ${
                    active
                        ? "active"
                        : "inactive"
                }`
            }
        >
            {active
                ? "ACTIVE"
                : "INACTIVE"}
        </span>
    );
}

export default LocationStatus;