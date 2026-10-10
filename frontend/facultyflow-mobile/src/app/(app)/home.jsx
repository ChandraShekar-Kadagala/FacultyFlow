import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import useAuth from "../../hooks/useAuth";

export default function HomeScreen() {
    const { user } = useAuth();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>
                        Good morning
                    </Text>

                    <Text style={styles.name}>
                        {user?.name || "Faculty User"}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() =>
                        router.push("/(app)/profile")
                    }
                >
                    <Ionicons
                        name="person-outline"
                        size={22}
                        color="#2563EB"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <View>
                        <Text style={styles.cardLabel}>
                            TODAY&apos;S ATTENDANCE
                        </Text>

                        <Text style={styles.statusTitle}>
                            Not Checked In
                        </Text>
                    </View>

                    <View style={styles.statusIcon}>
                        <Ionicons
                            name="time-outline"
                            size={26}
                            color="#2563EB"
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.timeRow}>
                    <View>
                        <Text style={styles.timeLabel}>
                            Check In
                        </Text>

                        <Text style={styles.timeValue}>
                            --
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.timeLabel}>
                            Check Out
                        </Text>

                        <Text style={styles.timeValue}>
                            --
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>
                Quick Actions
            </Text>

            <View style={styles.actionGrid}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        router.push("/(app)/attendance")
                    }
                >
                    <View
                        style={[
                            styles.actionIcon,
                            styles.blueIcon
                        ]}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={23}
                            color="#2563EB"
                        />
                    </View>

                    <Text style={styles.actionTitle}>
                        Attendance
                    </Text>

                    <Text style={styles.actionText}>
                        View today&apos;s attendance
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        router.push("/(app)/verification")
                    }
                >
                    <View
                        style={[
                            styles.actionIcon,
                            styles.greenIcon
                        ]}
                    >
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={23}
                            color="#16A34A"
                        />
                    </View>

                    <Text style={styles.actionTitle}>
                        Verification
                    </Text>

                    <Text style={styles.actionText}>
                        Check verification status
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
                Verification Overview
            </Text>

            <View style={styles.verificationCard}>
                <VerificationRow
                    icon="person-outline"
                    title="Identity"
                    status="Pending"
                />

                <VerificationRow
                    icon="finger-print-outline"
                    title="Biometric"
                    status="Pending"
                />

                <VerificationRow
                    icon="wifi-outline"
                    title="University Network"
                    status="Pending"
                />

                <VerificationRow
                    icon="location-outline"
                    title="Campus Location"
                    status="Pending"
                />

                <VerificationRow
                    icon="time-outline"
                    title="Schedule & Time"
                    status="Pending"
                />
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                    router.push("/(app)/verification")
                }
            >
                <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#FFFFFF"
                />

                <Text style={styles.primaryButtonText}>
                    Start Verification
                </Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
                <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#2563EB"
                />

                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>
                        FacultyFlow Security
                    </Text>

                    <Text style={styles.infoText}>
                        Attendance will only be recorded
                        after the required verification
                        checks are successfully completed.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

function VerificationRow({
    icon,
    title,
    status
}) {
    return (
        <View style={styles.verificationRow}>
            <View style={styles.verificationLeft}>
                <View style={styles.smallIcon}>
                    <Ionicons
                        name={icon}
                        size={18}
                        color="#64748B"
                    />
                </View>

                <Text style={styles.verificationTitle}>
                    {title}
                </Text>
            </View>

            <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>
                    {status}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FB"
    },

    content: {
        padding: 20,
        paddingBottom: 100
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24
    },

    greeting: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 4
    },

    name: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0F172A"
    },

    profileButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center"
    },

    statusCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 26
    },

    statusHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    cardLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.8,
        marginBottom: 7
    },

    statusTitle: {
        fontSize: 21,
        fontWeight: "800",
        color: "#0F172A"
    },

    statusIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center"
    },

    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 18
    },

    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    timeLabel: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 5
    },

    timeValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A"
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 12
    },

    actionGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 26
    },

    actionCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },

    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12
    },

    blueIcon: {
        backgroundColor: "#EFF6FF"
    },

    greenIcon: {
        backgroundColor: "#F0FDF4"
    },

    actionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 5
    },

    actionText: {
        fontSize: 12,
        lineHeight: 18,
        color: "#64748B"
    },

    verificationCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16
    },

    verificationRow: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9"
    },

    verificationLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },

    smallIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11
    },

    verificationTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155"
    },

    pendingBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#FEF3C7"
    },

    pendingText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#B45309"
    },

    primaryButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: "#2563EB",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        marginBottom: 16
    },

    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700"
    },

    infoCard: {
        flexDirection: "row",
        backgroundColor: "#EFF6FF",
        borderRadius: 14,
        padding: 15,
        borderWidth: 1,
        borderColor: "#DBEAFE"
    },

    infoContent: {
        flex: 1,
        marginLeft: 10
    },

    infoTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1D4ED8",
        marginBottom: 4
    },

    infoText: {
        fontSize: 12,
        lineHeight: 18,
        color: "#475569"
    }
});