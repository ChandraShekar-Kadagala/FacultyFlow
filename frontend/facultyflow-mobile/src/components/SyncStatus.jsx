import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View
} from "react-native";

import { useAttendance } from "../context/AttendanceContext";

function SyncStatus() {
    const {
        syncStatus,
        pendingCount
    } = useAttendance();

    const statusText =
        syncStatus === "PENDING_SYNC"
            ? "Pending synchronization"
            : syncStatus === "OFFLINE"
                ? "Offline"
                : syncStatus === "SYNCED"
                    ? "All changes synced"
                    : syncStatus;

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={styles.label}>
                    SYNC STATUS
                </Text>

                {syncStatus === "PENDING_SYNC" && (
                    <ActivityIndicator size="small" />
                )}
            </View>

            <Text style={styles.status}>
                {statusText}
            </Text>

            {pendingCount > 0 && (
                <Text style={styles.pending}>
                    {pendingCount} event
                    {pendingCount > 1
                        ? "s"
                        : ""}{" "}
                    waiting to sync
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 14,
        backgroundColor: "#FFFFFF"
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    label: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748B"
    },

    status: {
        marginTop: 6,
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A"
    },

    pending: {
        marginTop: 4,
        fontSize: 12,
        color: "#64748B"
    }
});

export default SyncStatus;