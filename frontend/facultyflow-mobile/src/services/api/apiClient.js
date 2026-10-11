import { API_CONFIG } from "../../config/env.js";

/**
 * Global callback for handling 401 session expiration.
 * Registered by AuthContext to ensure automatic logout when tokens expire.
 */
let sessionExpirationHandler = null;

export function setSessionExpirationHandler(handler) {
    sessionExpirationHandler = handler;
}

/**
 * Centralized API client for all mobile network requests.
 * 
 * Features:
 * - Base URL resolution from centralized config
 * - Standardized JSON request and response parsing
 * - Bearer token authorization header attachment
 * - AbortController timeout protection (15 seconds)
 * - Structured error objects (status, code, data)
 * - Automatic detection of 401 expired sessions
 */
export async function apiRequest(endpoint, options = {}) {
    const {
        method = "GET",
        body,
        accessToken,
        headers = {},
        timeoutMs = API_CONFIG.TIMEOUT_MS
    } = options;

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const fullUrl = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;

    const requestHeaders = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers
    };

    if (accessToken) {
        requestHeaders.Authorization = `${API_CONFIG.AUTH_HEADER_PREFIX} ${accessToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    const requestOptions = {
        method,
        headers: requestHeaders,
        signal: controller.signal
    };

    if (body !== undefined && body !== null) {
        requestOptions.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(fullUrl, requestOptions);
    } catch (networkError) {
        clearTimeout(timer);

        if (networkError.name === "AbortError") {
            const timeoutErr = new Error("Request timed out. Please check your network connection.");
            timeoutErr.code = "TIMEOUT_ERROR";
            timeoutErr.status = 0;
            timeoutErr.isTimeoutError = true;
            throw timeoutErr;
        }

        const netErr = new Error(
            `Unable to connect to FacultyFlow server (${API_CONFIG.BASE_URL}). Please verify your network and server status.`
        );
        netErr.code = "NETWORK_ERROR";
        netErr.status = 0;
        netErr.isNetworkError = true;
        throw netErr;
    } finally {
        clearTimeout(timer);
    }

    let data = null;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch (_jsonErr) {
            data = null;
        }
    } else {
        const text = await response.text();
        data = text ? { message: text } : null;
    }

    if (!response.ok) {
        // Handle 401 Unauthorized / Token Expired
        if (response.status === 401) {
            if (sessionExpirationHandler) {
                try {
                    sessionExpirationHandler();
                } catch (_err) {
                    // Suppress handler errors
                }
            }

            const authError = new Error(
                data?.message || "Your session has expired. Please sign in again."
            );
            authError.status = 401;
            authError.code = data?.code || "UNAUTHORIZED";
            authError.isAuthError = true;
            authError.data = data;
            throw authError;
        }

        const error = new Error(
            data?.message || `Request failed with status ${response.status}.`
        );
        error.status = response.status;
        error.code = data?.code || "API_REQUEST_FAILED";
        error.data = data;
        throw error;
    }

    return data;
}

export default apiRequest;