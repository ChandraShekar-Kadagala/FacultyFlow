import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAttendance } from "../context/AttendanceContext";

export default function SyncStatus() {
    const {
        syncStatus,
        pendingCount,
        failedCount,
        isOnline,
        isSyncing,
        isCheckedIn,
        attendance,
        triggerSync,
        retryFailedSync
    } = useAttendance();

    // Determine visual style and badges
    let statusLabel = "Queue Empty";
    let statusDescription = "Offline queue is clear. Ready to record today's attendance.";
    let badgeColor = "#64748B";
    let badgeBg = "#F1F5F9";
    let iconName = "cloud-outline";

    if (!isOnline) {
        statusLabel = "Offline Mode";
        statusDescription = pendingCount > 0
            ? `${pendingCount} event(s) queued locally. Will sync when back online.`
            : "No internet connection. New attendance actions will be queued locally.";
        badgeColor = "#D97706";
        badgeBg = "#FEF3C7";
        iconName = "cloud-offline-outline";
    } else if (isSyncing) {
        statusLabel = "Syncing";
        statusDescription = "Uploading queued offline events to the server...";
        badgeColor = "#2563EB";
        badgeBg = "#EFF6FF";
        iconName = "sync-outline";
    } else if (failedCount > 0 || syncStatus === "FAILED") {
        statusLabel = `${failedCount} Failed`;
        statusDescription = `${failedCount} event(s) failed or rejected by policy. Tap retry to attempt re-syncing.`;
        badgeColor = "#DC2626";
        badgeBg = "#FEF2F2";
        iconName = "alert-circle-outline";
    } else if (pendingCount > 0 || syncStatus === "PENDING_SYNC" || attendance?.syncStatus === "PENDING_SYNC") {
        statusLabel = `${pendingCount || 1} Pending Sync`;
        statusDescription = "Check-in stored locally on device. Waiting for server confirmation.";
        badgeColor = "#D97706";
        badgeBg = "#FEF3C7";
        iconName = "cloud-upload-outline";
    } else if (isCheckedIn) {
        statusLabel = "Synced";
        statusDescription = "Today's attendance record is verified and confirmed on the server.";
        badgeColor = "#16A34A";
        badgeBg = "#DCFCE7";
        iconName = "cloud-done-outline";
    } else {
        // Not checked in yet, queue is clean
        statusLabel = "Queue Ready";
        statusDescription = "Offline queue is idle. No pending records waiting to upload.";
        badgeColor = "#64748B";
        badgeBg = "#F1F5F9";
        iconName = "cloud-done-outline";
    }

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                    <Ionicons name={iconName} size={20} color={badgeColor} style={{ marginRight: 8 }} />
                    <Text style={styles.title}>OFFLINE SYNC STATUS</Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    {isSyncing ? (
                        <ActivityIndicator size="small" color={badgeColor} style={{ marginRight: 6 }} />
                    ) : null}
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                        {statusLabel.toUpperCase()}
                    </Text>
                </View>
            </View>

            <Text style={styles.description}>{statusDescription}</Text>

            {isOnline && failedCount > 0 && !isSyncing ? (
                <TouchableOpacity
                    style={[styles.syncBtn, { backgroundColor: "#DC2626" }]}
                    onPress={retryFailedSync}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.syncBtnText}>Retry Failed ({failedCount})</Text>
                </TouchableOpacity>
            ) : null}

            {isOnline && pendingCount > 0 && !isSyncing && (!failedCount || failedCount === 0) ? (
                <TouchableOpacity
                    style={styles.syncBtn}
                    onPress={triggerSync}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.syncBtnText}>Sync Now ({pendingCount})</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    titleWrap: {
        flexDirection: "row",
        alignItems: "center"
    },
    title: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.8
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700"
    },
    description: {
        fontSize: 12,
        color: "#64748B",
        lineHeight: 17
    },
    syncBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 12
    },
    syncBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF"
    }
});