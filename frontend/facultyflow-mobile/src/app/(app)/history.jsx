import { StyleSheet, Text, View } from "react-native";

function History() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Attendance History
            </Text>

            <Text style={styles.subtitle}>
                Your attendance records will appear here.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FB",
        justifyContent: "center",
        alignItems: "center",
        padding: 20
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A"
    },

    subtitle: {
        marginTop: 8,
        color: "#64748B",
        textAlign: "center"
    }
});

export default History;