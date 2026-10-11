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
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

    if (configuredUrl && configuredUrl.trim().length > 0) {
        return configuredUrl.trim().replace(/\/+$/, "");
    }

    // Release safeguard: Production builds must target the authoritative Render backend
    if (process.env.NODE_ENV === "production") {
        return PRODUCTION_API_URL;
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
    TIMEOUT_MS: 15000,
    AUTH_HEADER_PREFIX: "Bearer"
};

export default API_CONFIG;
