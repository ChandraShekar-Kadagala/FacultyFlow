import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

function Profile() {
    const { user, logout } = useAuth();

    function handleLogout() {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out of FacultyFlow?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(user?.name || "F").charAt(0).toUpperCase()}
                    </Text>
                </View>

                <Text style={styles.name}>
                    {user?.name || "Faculty Member"}
                </Text>

                <Text style={styles.email}>
                    {user?.email || "No email available"}
                </Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {(user?.status || "ACTIVE").toUpperCase()}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Faculty ID</Text>
                    <Text style={styles.value}>{user?.facultyId || user?.id || "—"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Employee Code</Text>
                    <Text style={styles.value}>{user?.employeeCode || "—"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Department</Text>
                    <Text style={styles.value}>{user?.department || "—"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Designation</Text>
                    <Text style={styles.value}>{user?.designation || "—"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>System Role</Text>
                    <Text style={styles.value}>{user?.role || "faculty"}</Text>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#DC2626" style={styles.logoutIcon} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC"
    },
    content: {
        padding: 20,
        paddingTop: 56,
        paddingBottom: 40
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "800"
    },
    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A"
    },
    email: {
        marginTop: 4,
        color: "#64748B",
        fontSize: 14,
        marginBottom: 12
    },
    badge: {
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 20
    },
    badgeText: {
        color: "#166534",
        fontSize: 11,
        fontWeight: "700"
    },
    infoRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9"
    },
    label: {
        color: "#64748B",
        fontSize: 13,
        fontWeight: "500"
    },
    value: {
        color: "#0F172A",
        fontSize: 14,
        fontWeight: "700"
    },
    logoutButton: {
        marginTop: 24,
        width: "100%",
        height: 48,
        borderRadius: 12,
        backgroundColor: "#FEE2E2",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    logoutIcon: {
        marginRight: 8
    },
    logoutText: {
        color: "#DC2626",
        fontSize: 15,
        fontWeight: "700"
    }
});

export default Profile;