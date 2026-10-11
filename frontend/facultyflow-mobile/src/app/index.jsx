import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { colors } from "../constants/colors";

export default function Index() {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.logo}>
                    <Text style={styles.logoText}>F</Text>
                </View>
                <Text style={styles.brandTitle}>FacultyFlow</Text>
                <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
                <Text style={styles.loadingText}>Initializing workspace...</Text>
            </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(app)/home" />;
    }

    return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background || "#F8FAFC"
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: colors.primary || "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16
    },
    logoText: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFFFFF"
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.text || "#0F172A",
        marginBottom: 24
    },
    spinner: {
        marginBottom: 12
    },
    loadingText: {
        fontSize: 13,
        color: colors.textSecondary || "#64748B"
    }
});