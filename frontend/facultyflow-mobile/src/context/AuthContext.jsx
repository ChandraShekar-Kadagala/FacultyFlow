import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";


import AsyncStorage
    from "@react-native-async-storage/async-storage";


import {
    loginUser
} from "../services/auth/authService";


const AuthContext =
    createContext(null);


const STORAGE_KEY =
    "facultyflow_auth_session";


export function AuthProvider({
    children
}) {

    const [
        user,
        setUser
    ] = useState(null);


    const [
        accessToken,
        setAccessToken
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    // ========================================================
    // RESTORE AUTHENTICATION SESSION
    // ========================================================

    async function loadStoredSession() {
        try {
            const storedSession = await AsyncStorage.getItem(STORAGE_KEY);
            if (!storedSession) {
                setLoading(false);
                return;
            }
            const session = JSON.parse(storedSession);
            if (session?.accessToken && session?.user) {
                setAccessToken(session.accessToken);
                setUser(session.user);
            }
        } catch (error) {
            console.error("Failed to restore authentication:", error);
            await AsyncStorage.removeItem(STORAGE_KEY);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {

        loadStoredSession();

    }, []);





    // ========================================================
    // LOGIN
    // ========================================================

    async function login(
        email,
        password
    ) {

        if (
            !email ||
            !password
        ) {

            return {

                success: false,

                message:
                    "Email and password are required."

            };

        }


        try {

            // ------------------------------------------------
            // REAL BACKEND LOGIN
            // ------------------------------------------------

            const result =
                await loginUser({

                    email:
                        email
                            .trim()
                            .toLowerCase(),

                    password

                });


            // ------------------------------------------------
            // SERVER RESPONSE VALIDATION
            // ------------------------------------------------

            if (
                !result?.accessToken ||
                !result?.user
            ) {

                return {

                    success: false,

                    message:
                        "Invalid login response from server."

                };

            }


            // ------------------------------------------------
            // NORMALIZE USER
            // ------------------------------------------------

            const authenticatedUser = {

                id:
                    result.user.facultyId ||
                    result.user.userId,

                userId:
                    result.user.userId,

                facultyId:
                    result.user.facultyId ||
                    null,

                name:
                    result.user.name,

                email:
                    result.user.email,

                role:
                    result.user.role,

                employeeCode:
                    result.user.employeeCode ||
                    null,

                department:
                    result.user.department ||
                    null,

                designation:
                    result.user.designation ||
                    null,

                status:
                    result.user.status ||
                    null

            };


            // ------------------------------------------------
            // STORE COMPLETE SESSION
            // ------------------------------------------------

            const session = {

                accessToken:
                    result.accessToken,

                user:
                    authenticatedUser

            };


            await AsyncStorage.setItem(

                STORAGE_KEY,

                JSON.stringify(
                    session
                )

            );


            // ------------------------------------------------
            // UPDATE MEMORY
            // ------------------------------------------------

            setAccessToken(
                result.accessToken
            );

            setUser(
                authenticatedUser
            );


            return {

                success: true,

                user:
                    authenticatedUser,

                accessToken:
                    result.accessToken

            };

        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            return {

                success: false,

                message:
                    error?.message ||
                    "Unable to login."

            };

        }

    }


    // ========================================================
    // LOGOUT
    // ========================================================

    async function logout() {

        try {

            await AsyncStorage.removeItem(
                STORAGE_KEY
            );


            setUser(null);

            setAccessToken(null);


            return {

                success: true

            };

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            return {

                success: false,

                message:
                    "Unable to clear login session."

            };

        }

    }


    // ========================================================
    // CONTEXT VALUE
    // ========================================================

    const value =
        useMemo(

            () => ({

                user,

                accessToken,

                loading,

                isAuthenticated:
                    Boolean(
                        user &&
                        accessToken
                    ),

                login,

                logout

            }),

            [
                user,
                accessToken,
                loading
            ]

        );


    return (

        <AuthContext.Provider
            value={value}
        >

            {children}

        </AuthContext.Provider>

    );

}


// ============================================================
// useAuth
// ============================================================

export function useAuth() {

    const context =
        useContext(
            AuthContext
        );


    if (!context) {

        throw new Error(
            "useAuth must be used inside AuthProvider."
        );

    }


    return context;

}


export default AuthContext;