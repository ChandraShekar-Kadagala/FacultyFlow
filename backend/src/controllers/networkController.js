import {
    getAllNetworks,
    getActiveNetworks,
    getNetworkById,
    createNetwork,
    updateNetwork,
    toggleNetwork,
    deleteNetwork
} from "../services/network/networkService.js";

export async function getAllNetworksController(req, res, next) {
    try {
        const networks = await getAllNetworks();
        return res.status(200).json({
            success: true,
            networks
        });
    } catch (error) {
        next(error);
    }
}

export async function getActiveNetworksController(req, res, next) {
    try {
        const networks = await getActiveNetworks();
        return res.status(200).json({
            success: true,
            networks
        });
    } catch (error) {
        next(error);
    }
}

export async function getNetworkByIdController(req, res, next) {
    try {
        const network = await getNetworkById(req.params.networkId);
        if (!network) {
            return res.status(404).json({
                success: false,
                message: "Network configuration not found."
            });
        }
        return res.status(200).json({
            success: true,
            network
        });
    } catch (error) {
        next(error);
    }
}

export async function createNetworkController(req, res, next) {
    try {
        const network = await createNetwork(req.body);
        return res.status(201).json({
            success: true,
            message: "Network configuration created successfully.",
            network
        });
    } catch (error) {
        next(error);
    }
}

export async function updateNetworkController(req, res, next) {
    try {
        const network = await updateNetwork(req.params.networkId, req.body);
        return res.status(200).json({
            success: true,
            message: "Network configuration updated successfully.",
            network
        });
    } catch (error) {
        next(error);
    }
}

export async function toggleNetworkController(req, res, next) {
    try {
        const { active } = req.body;
        const network = await toggleNetwork(req.params.networkId, active);
        return res.status(200).json({
            success: true,
            message: "Network configuration status updated.",
            network
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteNetworkController(req, res, next) {
    try {
        const network = await deleteNetwork(req.params.networkId);
        return res.status(200).json({
            success: true,
            message: "Network configuration deleted successfully.",
            network
        });
    } catch (error) {
        next(error);
    }
}
