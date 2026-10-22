import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function Index() {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return <LoadingScreen message="Initializing workspace..." />;
    }

    if (isAuthenticated) {
        return <Redirect href="/(app)/home" />;
    }

    return <Redirect href="/(auth)/login" />;
}
