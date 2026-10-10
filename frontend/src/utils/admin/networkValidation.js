function isValidIPv4(value) {
    const parts = value.split(".");

    if (parts.length !== 4) {
        return false;
    }

    return parts.every(part => {
        if (part === "") {
            return false;
        }

        const number = Number(part);

        return (
            Number.isInteger(number) &&
            number >= 0 &&
            number <= 255
        );
    });
}


function isValidCIDR(value) {
    const parts = value.split("/");

    if (parts.length !== 2) {
        return false;
    }

    const ip = parts[0];
    const prefix = Number(parts[1]);

    return (
        isValidIPv4(ip) &&
        Number.isInteger(prefix) &&
        prefix >= 0 &&
        prefix <= 32
    );
}


export function validateNetworkLocation(
    network
) {

    const errors = {};

    const name =
        String(network.name || "").trim();

    const building =
        String(network.building || "").trim();

    const floorArea =
        String(network.floorArea || "").trim();

    const ssid =
        String(network.expectedSSID || "").trim();


    if (!name) {
        errors.name =
            "Network name is required.";
    }


    if (!building) {
        errors.building =
            "Building is required.";
    }


    if (!floorArea) {
        errors.floorArea =
            "Floor / area is required.";
    }


    if (
        network.verificationMode === "SSID" ||
        network.verificationMode === "COMBINED"
    ) {
        if (!ssid) {
            errors.expectedSSID =
                "SSID is required for this verification mode.";
        }
    }


    if (
        network.verificationMode === "BSSID" ||
        network.verificationMode === "COMBINED"
    ) {

        const bssids =
            Array.isArray(
                network.expectedBSSIDs
            )
                ? network.expectedBSSIDs
                : [];

        if (bssids.length === 0) {
            errors.expectedBSSIDs =
                "At least one BSSID is required.";
        }
    }


    if (
        network.verificationMode === "IP_RANGE"
    ) {

        const ranges =
            Array.isArray(
                network.allowedIPRanges
            )
                ? network.allowedIPRanges
                : [];

        if (ranges.length === 0) {

            errors.allowedIPRanges =
                "At least one IP range is required.";

        } else {

            const invalidRange =
                ranges.find(
                    range =>
                        !isValidIPv4(range) &&
                        !isValidCIDR(range)
                );

            if (invalidRange) {
                errors.allowedIPRanges =
                    `Invalid IP range: ${invalidRange}`;
            }
        }
    }


    if (
        network.verificationMode === "COMBINED"
    ) {

        const hasBSSID =
            Array.isArray(
                network.expectedBSSIDs
            ) &&
            network.expectedBSSIDs.length > 0;

        const hasIP =
            Array.isArray(
                network.allowedIPRanges
            ) &&
            network.allowedIPRanges.length > 0;

        if (!hasBSSID && !hasIP) {
            errors.combined =
                "Combined mode requires BSSID or IP range configuration.";
        }
    }


    return {
        isValid:
            Object.keys(errors).length === 0,

        errors
    };
}