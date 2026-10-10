import { useAuth as useAuthContext } from "../context/AuthContext";

function useAuth() {
    return useAuthContext();
}

export default useAuth;