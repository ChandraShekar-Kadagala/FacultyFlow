import NetworkLocation from "../../models/NetworkLocation.js";

function generateNetworkId() {
    return `NET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function getAllNetworks() {
    return NetworkLocation.find({}).sort({ createdAt: -1 }).lean();
}

export async function getActiveNetworks() {
    return NetworkLocation.find({ active: true }).sort({ name: 1 }).lean();
}

export async function getNetworkById(networkLocationId) {
    return NetworkLocation.findOne({
        $or: [
            { networkLocationId },
            { id: networkLocationId }
        ]
    }).lean();
}

export async function createNetwork(data) {
    const networkLocationId = data.networkLocationId || data.id || generateNetworkId();

    const allowedModes = ["SSID", "BSSID", "IP_RANGE", "BSSID_OR_IP", "BSSID_AND_IP", "COMBINED"];
    let mode = data.verificationMode || "BSSID_OR_IP";
    if (mode === "COMBINED") {
        mode = "BSSID_OR_IP";
    }
    if (!allowedModes.includes(mode)) {
        mode = "BSSID_OR_IP";
    }

    const payload = {
        networkLocationId,
        name: String(data.name || "").trim(),
        building: data.building ? String(data.building).trim() : null,
        floorArea: data.floorArea ? String(data.floorArea).trim() : null,
        expectedSSID: data.expectedSSID ? String(data.expectedSSID).trim() : null,
        expectedBSSIDs: Array.isArray(data.expectedBSSIDs)
            ? data.expectedBSSIDs.map(b => String(b).trim().toUpperCase()).filter(Boolean)
            : [],
        allowedIPRanges: Array.isArray(data.allowedIPRanges)
            ? data.allowedIPRanges.map(ip => String(ip).trim()).filter(Boolean)
            : [],
        verificationMode: mode,
        active: data.active !== undefined ? Boolean(data.active) : true
    };

    if (!payload.name) {
        const error = new Error("Network name is required.");
        error.statusCode = 400;
        throw error;
    }

    const created = await NetworkLocation.create(payload);
    return created.toObject();
}

export async function updateNetwork(networkLocationId, updates) {
    const filter = {
        $or: [
            { networkLocationId },
            { id: networkLocationId }
        ]
    };

    const updatePayload = {};
    if (updates.name !== undefined) updatePayload.name = String(updates.name).trim();
    if (updates.building !== undefined) updatePayload.building = updates.building ? String(updates.building).trim() : null;
    if (updates.floorArea !== undefined) updatePayload.floorArea = updates.floorArea ? String(updates.floorArea).trim() : null;
    if (updates.expectedSSID !== undefined) updatePayload.expectedSSID = updates.expectedSSID ? String(updates.expectedSSID).trim() : null;
    if (updates.expectedBSSIDs !== undefined) {
        updatePayload.expectedBSSIDs = Array.isArray(updates.expectedBSSIDs)
            ? updates.expectedBSSIDs.map(b => String(b).trim().toUpperCase()).filter(Boolean)
            : [];
    }
    if (updates.allowedIPRanges !== undefined) {
        updatePayload.allowedIPRanges = Array.isArray(updates.allowedIPRanges)
            ? updates.allowedIPRanges.map(ip => String(ip).trim()).filter(Boolean)
            : [];
    }
    if (updates.verificationMode !== undefined) {
        let mode = updates.verificationMode;
        if (mode === "COMBINED") mode = "BSSID_OR_IP";
        updatePayload.verificationMode = mode;
    }
    if (updates.active !== undefined) updatePayload.active = Boolean(updates.active);

    const updated = await NetworkLocation.findOneAndUpdate(filter, updatePayload, { new: true }).lean();
    if (!updated) {
        const error = new Error("Network configuration was not found.");
        error.statusCode = 404;
        throw error;
    }
    return updated;
}

export async function toggleNetwork(networkLocationId, active) {
    const filter = {
        $or: [
            { networkLocationId },
            { id: networkLocationId }
        ]
    };

    const updated = await NetworkLocation.findOneAndUpdate(
        filter,
        { active: Boolean(active) },
        { new: true }
    ).lean();

    if (!updated) {
        const error = new Error("Network configuration was not found.");
        error.statusCode = 404;
        throw error;
    }
    return updated;
}

export async function deleteNetwork(networkLocationId) {
    const filter = {
        $or: [
            { networkLocationId },
            { id: networkLocationId }
        ]
    };

    const deleted = await NetworkLocation.findOneAndDelete(filter).lean();
    if (!deleted) {
        const error = new Error("Network configuration was not found.");
        error.statusCode = 404;
        throw error;
    }
    return deleted;
}
