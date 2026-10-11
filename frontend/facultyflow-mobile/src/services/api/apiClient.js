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
 * - Normalization against duplicate or missing /api path segments
 * - Standardized JSON and safe non-JSON (HTML/text) response parsing
 * - Bearer token authorization header attachment
 * - AbortController timeout protection with cold-start tolerance
 * - Distinct handling of timeouts, network failures, 401/403 auth errors, and 500/503 server errors
 * - Single automatic retry for cold-start wakeups on safe endpoints
 * - Selective 401 session expiration (never expires session on /auth/login)
 */
export async function apiRequest(endpoint, options = {}) {
    const {
        method = "GET",
        body,
        accessToken,
        headers = {},
        timeoutMs = API_CONFIG.TIMEOUT_MS,
        retry = false,
        isRetry = false
    } = options;

    const cleanBase = (API_CONFIG.BASE_URL || "").replace(/\/+$/, "");
    let normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Prevent duplicate /api segments if caller included /api
    if (cleanBase.endsWith("/api") && normalizedEndpoint.startsWith("/api/")) {
        normalizedEndpoint = normalizedEndpoint.slice(4);
    }

    const fullUrl = `${cleanBase}${normalizedEndpoint}`;

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

        const isAborted = controller.signal.aborted ||
            networkError.name === "AbortError" ||
            (networkError.message && networkError.message.toLowerCase().includes("abort")) ||
            (networkError.message && networkError.message.toLowerCase().includes("timeout"));

        // Single retry on timeout or cold start if requested
        if (retry && !isRetry && (method === "GET" || normalizedEndpoint === "/auth/login")) {
            try {
                await new Promise(r => setTimeout(r, 2000));
                return await apiRequest(endpoint, {
                    ...options,
                    isRetry: true,
                    timeoutMs: Math.max(timeoutMs, 35000)
                });
            } catch (retryError) {
                throw retryError;
            }
        }

        if (isAborted) {
            const timeoutErr = new Error(
                `Request timed out (${Math.round(timeoutMs / 1000)}s). The FacultyFlow server may be waking up from standby. Please try again.`
            );
            timeoutErr.code = "TIMEOUT_ERROR";
            timeoutErr.status = 0;
            timeoutErr.isTimeoutError = true;
            timeoutErr.isNetworkError = true;
            throw timeoutErr;
        }

        const netErr = new Error(
            `Unable to connect to FacultyFlow server (${cleanBase}). Please verify your network and server status.`
        );
        netErr.code = "NETWORK_ERROR";
        netErr.status = 0;
        netErr.isNetworkError = true;
        throw netErr;
    } finally {
        clearTimeout(timer);
    }

    let data = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch (_jsonErr) {
            data = null;
        }
    } else {
        const text = await response.text();
        if (text && text.trim().startsWith("<")) {
            // HTML response from hosting proxy or gateway
            data = {
                message: response.status >= 500
                    ? `FacultyFlow server is temporarily unavailable (HTTP ${response.status}). The service may be starting up.`
                    : `Server returned an unexpected response (HTTP ${response.status}).`
            };
        } else {
            data = text ? { message: text.slice(0, 300) } : null;
        }
    }

    if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
            // Only trigger session expiration for established sessions, NEVER for initial /auth/login
            const isLoginRoute = normalizedEndpoint.includes("/auth/login");
            if (!isLoginRoute && sessionExpirationHandler) {
                try {
                    sessionExpirationHandler();
                } catch (_err) {
                    // Suppress handler errors
                }
            }

            const authError = new Error(
                data?.message || (isLoginRoute ? "Invalid email or password." : "Your session has expired. Please sign in again.")
            );
            authError.status = 401;
            authError.code = data?.code || "UNAUTHORIZED";
            authError.isAuthError = true;
            authError.data = data;
            throw authError;
        }

        // Handle 403 Forbidden
        if (response.status === 403) {
            const forbiddenError = new Error(
                data?.message || "Access forbidden. Your account may be inactive or lack permissions."
            );
            forbiddenError.status = 403;
            forbiddenError.code = data?.code || "FORBIDDEN";
            forbiddenError.data = data;
            throw forbiddenError;
        }

        // Handle 404 Not Found
        if (response.status === 404) {
            const notFoundError = new Error(
                data?.message || `Endpoint not found: ${normalizedEndpoint}`
            );
            notFoundError.status = 404;
            notFoundError.code = data?.code || "NOT_FOUND";
            notFoundError.data = data;
            throw notFoundError;
        }

        // Handle 429 Rate Limited
        if (response.status === 429) {
            const rateError = new Error(
                data?.message || "Too many requests. Please wait a moment before trying again."
            );
            rateError.status = 429;
            rateError.code = data?.code || "RATE_LIMITED";
            rateError.data = data;
            throw rateError;
        }

        // Handle 502 / 503 / 504 Service Unavailable
        if (response.status === 502 || response.status === 503 || response.status === 504) {
            const serviceError = new Error(
                data?.message || `FacultyFlow server is temporarily unavailable (HTTP ${response.status}). Please try again in a few moments.`
            );
            serviceError.status = response.status;
            serviceError.code = data?.code || "SERVER_UNAVAILABLE";
            serviceError.isServerError = true;
            serviceError.data = data;
            throw serviceError;
        }

        const error = new Error(
            data?.message || `Request failed with status ${response.status}.`
        );
        error.status = response.status;
        error.code = data?.code || "API_REQUEST_FAILED";
        error.isServerError = response.status >= 500;
        error.data = data;
        throw error;
    }

    return data;
}

export default apiRequest;