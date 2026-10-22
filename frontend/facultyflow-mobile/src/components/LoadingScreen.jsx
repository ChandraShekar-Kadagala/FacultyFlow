import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

export default function LoadingScreen({ message = "Initializing workspace..." }) {
    return (
        <View style={styles.container}>
            <View style={styles.logo}>
                <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={styles.brandTitle}>FacultyFlow</Text>
            <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
            <Text style={styles.loadingText}>{message}</Text>
        </View>
    );
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
        marginBottom: 16,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4
    },
    logoText: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFFFFF"
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.3,
        marginBottom: 16
    },
    spinner: {
        marginBottom: 12
    },
    loadingText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748B"
    }
});
