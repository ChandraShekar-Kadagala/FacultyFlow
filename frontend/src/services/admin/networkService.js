const NETWORK_STORAGE_KEY =
    "facultyflow_network_locations";


const DEFAULT_NETWORKS = [
    {
        id: "network-main-campus",
        name: "Main Campus Wi-Fi",
        building: "Main Campus",
        floorArea: "Campus Network",

        expectedSSID: "UNIVERSITY_WIFI",

        expectedBSSIDs: [
            "00:00:00:00:00:00"
        ],

        allowedIPRanges: [
            "192.168.1.0/24"
        ],

        verificationMode: "COMBINED",

        active: true
    }
];


function createNetworkId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        "network-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}


function getDefaultNetworks() {

    return DEFAULT_NETWORKS.map(
        network => ({
            ...network,

            expectedBSSIDs: [
                ...(network.expectedBSSIDs || [])
            ],

            allowedIPRanges: [
                ...(network.allowedIPRanges || [])
            ]
        })
    );
}


export function getNetworkLocations() {

    try {

        const stored =
            localStorage.getItem(
                NETWORK_STORAGE_KEY
            );


        if (!stored) {
            return getDefaultNetworks();
        }


        const parsed =
            JSON.parse(stored);


        if (!Array.isArray(parsed)) {
            return getDefaultNetworks();
        }


        return parsed;

    } catch (error) {

        console.error(
            "Failed to load network locations:",
            error
        );

        return getDefaultNetworks();
    }
}


function saveNetworks(
    networks
) {

    try {

        localStorage.setItem(
            NETWORK_STORAGE_KEY,
            JSON.stringify(networks)
        );

        return true;

    } catch (error) {

        console.error(
            "Failed to save network locations:",
            error
        );

        return false;
    }
}


export function createNetworkLocation(
    network
) {

    const networks =
        getNetworkLocations();


    const newNetwork = {

        id:
            createNetworkId(),

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
            Array.isArray(
                network.expectedBSSIDs
            )
                ? network.expectedBSSIDs
                : [],

        allowedIPRanges:
            Array.isArray(
                network.allowedIPRanges
            )
                ? network.allowedIPRanges
                : [],

        verificationMode:
            network.verificationMode,

        active:
            Boolean(
                network.active
            )
    };


    const updatedNetworks = [
        ...networks,
        newNetwork
    ];


    const saved =
        saveNetworks(
            updatedNetworks
        );


    return {
        success: saved,

        network:
            saved
                ? newNetwork
                : null
    };
}


export function updateNetworkLocation(
    networkId,
    updates
) {

    const networks =
        getNetworkLocations();


    const updatedNetworks =
        networks.map(
            network => {

                if (
                    network.id !==
                    networkId
                ) {
                    return network;
                }


                return {
                    ...network,

                    ...updates,

                    expectedBSSIDs:
                        Array.isArray(
                            updates.expectedBSSIDs
                        )
                            ? updates.expectedBSSIDs
                            : network.expectedBSSIDs,

                    allowedIPRanges:
                        Array.isArray(
                            updates.allowedIPRanges
                        )
                            ? updates.allowedIPRanges
                            : network.allowedIPRanges
                };
            }
        );


    const saved =
        saveNetworks(
            updatedNetworks
        );


    return {
        success: saved,
        networks:
            updatedNetworks
    };
}


export function toggleNetworkLocation(
    networkId
) {

    const networks =
        getNetworkLocations();


    const updatedNetworks =
        networks.map(
            network =>
                network.id === networkId
                    ? {
                        ...network,
                        active:
                            !network.active
                    }
                    : network
        );


    const saved =
        saveNetworks(
            updatedNetworks
        );


    return {
        success: saved,
        networks:
            updatedNetworks
    };
}


export function deleteNetworkLocation(
    networkId
) {

    const networks =
        getNetworkLocations();


    const updatedNetworks =
        networks.filter(
            network =>
                network.id !== networkId
        );


    const saved =
        saveNetworks(
            updatedNetworks
        );


    return {
        success: saved,
        networks:
            updatedNetworks
    };
}


export function resetNetworkLocations() {

    const networks =
        getDefaultNetworks();


    const saved =
        saveNetworks(
            networks
        );


    return {
        success: saved,
        networks
    };
}