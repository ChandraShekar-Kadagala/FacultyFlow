import apiRequest from "../api/apiClient";

const NETWORK_STORAGE_KEY = "facultyflow_network_locations";

const DEFAULT_NETWORKS = [
    {
        networkLocationId: "network-main-campus",
        id: "network-main-campus",
        name: "Main Campus Wi-Fi",
        building: "Main Campus",
        floorArea: "Campus Network",
        expectedSSID: "UNIVERSITY_WIFI",
        expectedBSSIDs: ["00:00:00:00:00:00"],
        allowedIPRanges: ["192.168.1.0/24"],
        verificationMode: "COMBINED",
        active: true
    }
];

function createNetworkId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "network-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
}

function getLocalNetworks() {
    try {
        const stored = localStorage.getItem(NETWORK_STORAGE_KEY);
        if (!stored) return DEFAULT_NETWORKS;
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : DEFAULT_NETWORKS;
    } catch {
        return DEFAULT_NETWORKS;
    }
}

function saveLocalNetworks(list) {
    try {
        localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
        console.error("Failed to save networks locally:", err);
    }
}

export async function getNetworkLocations(accessToken) {
    if (accessToken) {
        try {
            const response = await apiRequest("/admin/networks", {
                method: "GET",
                token: accessToken
            });
            const list = Array.isArray(response)
                ? response
                : (response?.networks || []);
            saveLocalNetworks(list);
            return list;
        } catch (err) {
            console.warn("Failed to load networks from server, using local fallback:", err);
        }
    }
    return getLocalNetworks();
}

export async function createNetworkLocation(network, accessToken) {
    if (accessToken) {
        try {
            const response = await apiRequest("/admin/networks", {
                method: "POST",
                token: accessToken,
                body: network
            });
            return response?.network || response;
        } catch (err) {
            console.error("API create network failed, persisting locally:", err);
        }
    }

    const current = getLocalNetworks();
    const newNetwork = {
        networkLocationId: createNetworkId(),
        id: createNetworkId(),
        name: String(network.name || "").trim(),
        building: String(network.building || "").trim(),
        floorArea: String(network.floorArea || "").trim(),
        expectedSSID: String(network.expectedSSID || "").trim(),
        expectedBSSIDs: Array.isArray(network.expectedBSSIDs) ? network.expectedBSSIDs : [],
        allowedIPRanges: Array.isArray(network.allowedIPRanges) ? network.allowedIPRanges : [],
        verificationMode: network.verificationMode || "COMBINED",
        active: network.active !== undefined ? Boolean(network.active) : true
    };
    saveLocalNetworks([...current, newNetwork]);
    return newNetwork;
}

export async function updateNetworkLocation(networkId, updates, accessToken) {
    if (accessToken) {
        try {
            const response = await apiRequest(`/admin/networks/${networkId}`, {
                method: "PUT",
                token: accessToken,
                body: updates
            });
            return response?.network || response;
        } catch (err) {
            console.error("API update network failed, updating locally:", err);
        }
    }

    const current = getLocalNetworks();
    const updated = current.map(item => {
        if ((item.networkLocationId === networkId) || (item.id === networkId)) {
            return { ...item, ...updates };
        }
        return item;
    });
    saveLocalNetworks(updated);
    return updated.find(i => (i.networkLocationId === networkId) || (i.id === networkId));
}

export async function toggleNetworkLocation(networkId, active, accessToken) {
    if (accessToken) {
        try {
            const response = await apiRequest(`/admin/networks/${networkId}/toggle`, {
                method: "PATCH",
                token: accessToken,
                body: { active }
            });
            return response?.network || response;
        } catch (err) {
            console.error("API toggle network failed, toggling locally:", err);
        }
    }

    const current = getLocalNetworks();
    const updated = current.map(item => {
        if ((item.networkLocationId === networkId) || (item.id === networkId)) {
            return { ...item, active: Boolean(active) };
        }
        return item;
    });
    saveLocalNetworks(updated);
    return updated.find(i => (i.networkLocationId === networkId) || (i.id === networkId));
}

export async function deleteNetworkLocation(networkId, accessToken) {
    if (accessToken) {
        try {
            await apiRequest(`/admin/networks/${networkId}`, {
                method: "DELETE",
                token: accessToken
            });
        } catch (err) {
            console.error("API delete network failed, deleting locally:", err);
        }
    }

    const current = getLocalNetworks();
    const updated = current.filter(item => (item.networkLocationId !== networkId) && (item.id !== networkId));
    saveLocalNetworks(updated);
    return true;
}

export function resetNetworkLocations() {
    saveLocalNetworks(DEFAULT_NETWORKS);
    return DEFAULT_NETWORKS;
}