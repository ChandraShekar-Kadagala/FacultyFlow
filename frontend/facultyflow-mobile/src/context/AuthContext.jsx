import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback
} from "react";

import {
    saveAuthToken,
    getAuthToken,
    saveUserSession,
    getUserSession,
    clearSession
} from "../services/storage/secureStorage";

import {
    loginUser
} from "../services/auth/authService";

import {
    setSessionExpirationHandler,
    apiRequest
} from "../services/api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);

    // ========================================================
    // LOGOUT
    // ========================================================
    const logout = useCallback(async (isExpired = false) => {
        try {
            await clearSession();
        } catch (err) {
            console.error("Failed to clear secure session:", err);
        } finally {
            setUser(null);
            setAccessToken(null);
            if (isExpired) {
                setSessionExpired(true);
            }
        }
    }, []);

    // Register 401 session expiration callback with API client
    useEffect(() => {
        setSessionExpirationHandler(() => {
            logout(true);
        });
    }, [logout]);

    // ========================================================
    // RESTORE & VERIFY STORED SESSION ON LAUNCH
    // ========================================================
    useEffect(() => {
        let isMounted = true;

        async function restoreSession() {
            try {
                const storedToken = await getAuthToken();
                const storedUser = await getUserSession();

                if (!storedToken || !storedUser) {
                    if (isMounted) setLoading(false);
                    return;
                }

                // Verify token with backend
                try {
                    const verifyResponse = await apiRequest("/auth/verify", {
                        method: "GET",
                        accessToken: storedToken,
                        timeoutMs: 5000
                    });

                    if (isMounted && verifyResponse?.success) {
                        setAccessToken(storedToken);
                        setUser(storedUser);
                    } else {
                        await clearSession();
                    }
                } catch (verifyErr) {
                    if (verifyErr?.isAuthError || verifyErr?.status === 401) {
                        // Token expired
                        await clearSession();
                    } else {
                        // Network error / offline on launch — restore stored session in degraded mode
                        if (isMounted) {
                            setAccessToken(storedToken);
                            setUser(storedUser);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to restore session:", err);
                await clearSession();
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, []);

    // ========================================================
    // LOGIN
    // ========================================================
    const login = useCallback(async (email, password) => {
        if (!email || !password) {
            return {
                success: false,
                message: "Email and password are required."
            };
        }

        try {
            const result = await loginUser({
                email: email.trim().toLowerCase(),
                password
            });

            if (!result?.accessToken || !result?.user) {
                return {
                    success: false,
                    message: "Invalid response from server."
                };
            }

            const rawUser = result.user;
            const normalizedUser = {
                id: rawUser.facultyId || rawUser.userId,
                userId: rawUser.userId,
                facultyId: rawUser.facultyId || null,
                name: rawUser.name,
                email: rawUser.email,
                role: rawUser.role,
                employeeCode: rawUser.employeeCode || null,
                department: rawUser.department || null,
                designation: rawUser.designation || null,
                status: rawUser.status || "active"
            };

            // Store token in SecureStore (or AsyncStorage on web)
            await saveAuthToken(result.accessToken);
            // Store user metadata
            await saveUserSession(normalizedUser);

            setAccessToken(result.accessToken);
            setUser(normalizedUser);
            setSessionExpired(false);

            return {
                success: true,
                user: normalizedUser,
                accessToken: result.accessToken
            };
        } catch (err) {
            console.error("Login failed:", err);
            return {
                success: false,
                message: err?.message || "Unable to sign in. Please verify your credentials."
            };
        }
    }, []);

    const resetSessionExpired = useCallback(() => {
        setSessionExpired(false);
    }, []);

    const value = useMemo(() => ({
        user,
        accessToken,
        loading,
        sessionExpired,
        isAuthenticated: Boolean(user && accessToken),
        login,
        logout,
        resetSessionExpired
    }), [user, accessToken, loading, sessionExpired, login, logout, resetSessionExpired]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }
    return context;
}

export default AuthContext;