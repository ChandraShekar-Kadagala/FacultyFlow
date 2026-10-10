import {
    StyleSheet,
    Text,
    View
} from "react-native";

import useAuth from "../../hooks/useAuth";

function Profile() {
    const { user } = useAuth();

    return (
        <View style={styles.container}>

            <View style={styles.card}>

                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(user?.name || "F").charAt(0).toUpperCase()}
                    </Text>
                </View>

                <Text style={styles.name}>
                    {user?.name || "Faculty User"}
                </Text>

                <Text style={styles.email}>
                    {user?.email || "faculty@facultyflow.com"}
                </Text>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>
                        Faculty ID
                    </Text>

                    <Text style={styles.value}>
                        {user?.id || "F101"}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>
                        Role
                    </Text>

                    <Text style={styles.value}>
                        {user?.role || "faculty"}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>
                        Department
                    </Text>

                    <Text style={styles.value}>
                        {user?.department || "CSE"}
                    </Text>
                </View>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FB",
        padding: 20,
        paddingTop: 56
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center"
    },

    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14
    },

    avatarText: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800"
    },

    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A"
    },

    email: {
        marginTop: 5,
        color: "#64748B",
        marginBottom: 24
    },

    infoRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0"
    },

    label: {
        color: "#64748B"
    },

    value: {
        color: "#0F172A",
        fontWeight: "700"
    }
});

export default Profile;