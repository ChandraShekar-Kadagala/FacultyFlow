function NetworkStatus({
    active
}) {

    return (
        <span
            className={
                `network-status ${
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


export default NetworkStatus;