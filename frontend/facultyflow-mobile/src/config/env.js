/**
 * Resolves the backend API base URL safely across platforms and environments.
 * 
 * Rules:
 * 1. Honors EXPO_PUBLIC_API_URL from environment / .env file.
 * 2. On Android emulators, localhost must be accessed via 10.0.2.2.
 * 3. On web / iOS simulators, localhost:5000 is standard for local development.
 * 4. Ensures no trailing slash for consistent endpoint concatenation.
 */
export const PRODUCTION_API_URL = "https://facultyflow-1kgs.onrender.com/api";

function resolveApiBaseUrl() {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

    // Release safeguard: Production builds must target the authoritative Render backend
    // and never use local emulator/localhost loopbacks
    if (process.env.NODE_ENV === "production") {
        if (configuredUrl && !configuredUrl.includes("localhost") && !configuredUrl.includes("10.0.2.2")) {
            return configuredUrl.replace(/\/+$/, "");
        }
        return PRODUCTION_API_URL;
    }

    if (configuredUrl && configuredUrl.length > 0) {
        return configuredUrl.replace(/\/+$/, "");
    }

    const isAndroid = process.env.EXPO_OS === "android";
    if (isAndroid) {
        return "http://10.0.2.2:5000/api";
    }

    return "http://localhost:5000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    TIMEOUT_MS: 35000,
    AUTH_HEADER_PREFIX: "Bearer"
};

export default API_CONFIG;
