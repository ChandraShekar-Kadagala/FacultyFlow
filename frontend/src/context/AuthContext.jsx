import {
    createContext,
    useState
} from "react";


import {
    loginUser
} from "../services/auth/authService";


import {
    saveAuthSession,
    getAccessToken,
    getStoredUser,
    clearAuthSession
} from "../services/auth/authStorage";


const AuthContext =
    createContext(null);


export function AuthProvider({
    children
}) {

    const [
        user,
        setUser
    ] = useState(
        getStoredUser
    );


    const [
        isLoading,
        setIsLoading
    ] = useState(false);


    async function login(
        email,
        password
    ) {

        setIsLoading(true);


        try {

            const response =
                await loginUser(
                    email,
                    password
                );


            if (
                !response?.success ||
                !response?.accessToken ||
                !response?.user
            ) {

                return {

                    success: false,

                    message:
                        "Invalid authentication response."
                };
            }


            saveAuthSession(
                response.accessToken,
                response.user
            );


            setUser(
                response.user
            );


            return {

                success: true,

                user:
                    response.user
            };

        } catch (error) {

            return {

                success: false,

                message:
                    error.message ||
                    "Login failed."
            };

        } finally {

            setIsLoading(false);
        }
    }


    function logout() {

        clearAuthSession();

        setUser(null);
    }


    const value = {

        user,

        isAuthenticated:
            Boolean(user),

        isLoading,

        accessToken:
            getAccessToken(),

        login,

        logout
    };


    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}


export default AuthContext;