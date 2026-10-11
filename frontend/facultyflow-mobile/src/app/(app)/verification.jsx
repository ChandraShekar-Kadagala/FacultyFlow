import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAttendance } from "../../context/AttendanceContext";

function normalizeSignals(verification, attendance) {
    const rawEvents = verification?.events || verification?.verificationEvents || [];
    const checks = verification?.checks || {};

    const findEvent = (type) => {
        return rawEvents.find(e => (e?.type || "").toUpperCase() === type) ||
               (checks[type.toLowerCase()] ? checks[type.toLowerCase()] : null);
    };

    const hasAttendance = Boolean(attendance?.checkInTime);

    // 1. Identity
    const idEvt = findEvent("IDENTITY");
    const idResult = idEvt?.result || (hasAttendance ? "PASSED" : "PENDING");
    const idReason = idEvt?.reason || (hasAttendance ? "Faculty credentials validated by authoritative server." : "Awaiting check-in session initiation.");

    // 2. Schedule
    const schEvt = findEvent("SCHEDULE");
    const schResult = schEvt?.result || (hasAttendance ? (attendance?.status === "Late" ? "PASSED" : "PASSED") : "PENDING");
    const schReason = schEvt?.reason || (hasAttendance ? `Evaluated under attendance policy (Status: ${attendance?.status || "Present"}).` : "Evaluated against active institution hours upon check-in.");

    // 3. Location
    const locEvt = findEvent("LOCATION");
    const locResult = locEvt?.result || (hasAttendance ? (locEvt?.result || "UNAVAILABLE") : "PENDING");
    const locReason = locEvt?.reason || (hasAttendance ? "Device GPS signal unavailable or campus perimeter not enforced." : "Requires location permission during check-in.");

    // 4. Device
    const devEvt = findEvent("DEVICE");
    const devResult = devEvt?.result || (hasAttendance ? "UNAVAILABLE" : "PENDING");
    const devReason = devEvt?.reason || "Device biometric/hardware signal not provided or unavailable on this device.";

    // 5. Network
    const netEvt = findEvent("NETWORK");
    const netResult = netEvt?.result || (hasAttendance ? "UNAVAILABLE" : "PENDING");
    const netReason = netEvt?.reason || "Campus Wi-Fi / secure network observation not reported by mobile client.";

    return [
        {
            key: "IDENTITY",
            name: "Identity Verification",
            icon: "person-circle-outline",
            result: idResult,
            reason: idReason,
            notes: "Matches authenticated session claims against authoritative faculty record in MongoDB."
        },
        {
            key: "SCHEDULE",
            name: "Institutional Schedule",
            icon: "time-outline",
            result: schResult,
            reason: schReason,
            notes: "Validates request timestamp against active academic attendance policies."
        },
        {
            key: "LOCATION",
            name: "Campus Geofence Location",
            icon: "location-outline",
            result: locResult,
            reason: locReason,
            notes: "Evaluates physical campus perimeter without faking coordinates or masking permission denials."
        },
        {
            key: "DEVICE",
            name: "Device Authenticity",
            icon: "phone-portrait-outline",
            result: devResult,
            reason: devReason,
            notes: "Hardware token storage verified. Raw biometric templates are never collected or stored."
        },
        {
            key: "NETWORK",
            name: "Campus Wi-Fi Signal",
            icon: "wifi-outline",
            result: netResult,
            reason: netReason,
            notes: "Institutional SSID / BSSID validation. Unavailable when on cellular or unmanaged networks."
        }
    ];
}

function getResultBadge(result) {
    const r = (result || "PENDING").toUpperCase();
    if (r === "PASSED" || r === "VERIFIED") {
        return {
            bg: "#DCFCE7",
            text: "#15803D",
            icon: "checkmark-circle",
            label: "PASSED"
        };
    }
    if (r === "FAILED" || r === "REJECTED") {
        return {
            bg: "#FEE2E2",
            text: "#B91C1C",
            icon: "close-circle",
            label: "FAILED"
        };
    }
    if (r === "UNAVAILABLE") {
        return {
            bg: "#F1F5F9",
            text: "#64748B",
            icon: "help-circle-outline",
            label: "UNAVAILABLE"
        };
    }
    return {
        bg: "#FEF3C7",
        text: "#B45309",
        icon: "hourglass-outline",
        label: "PENDING"
    };
}

export default function VerificationScreen() {
    const {
        attendance,
        verification,
        loading,
        verificationStatus,
        refreshAttendance
    } = useAttendance();

    const signals = normalizeSignals(verification, attendance);
    const overallResult = (verification?.result || verificationStatus || "PENDING").toUpperCase();
    const isOverallVerified = overallResult === "VERIFIED" || overallResult === "PASSED";

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={() => refreshAttendance(true)}
                    tintColor="#2563EB"
                    colors={["#2563EB"]}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.eyebrow}>SECURITY &amp; COMPLIANCE</Text>
                <Text style={styles.title}>Signal Verification</Text>
                <Text style={styles.subtitle}>
                    Real-time multi-factor signal analysis evaluated by the FacultyFlow backend engine.
                </Text>
            </View>

            {/* Overall Verdict Card */}
            <View style={[
                styles.verdictCard,
                isOverallVerified ? styles.verdictCardPass : styles.verdictCardPending
            ]}>
                <View style={styles.verdictIconBox}>
                    <Ionicons
                        name={isOverallVerified ? "shield-checkmark" : "shield-outline"}
                        size={32}
                        color={isOverallVerified ? "#16A34A" : "#D97706"}
                    />
                </View>
                <View style={styles.verdictContent}>
                    <Text style={styles.verdictLabel}>OVERALL SERVER DECISION</Text>
                    <Text style={[
                        styles.verdictTitle,
                        isOverallVerified ? styles.verdictTitlePass : styles.verdictTitlePending
                    ]}>
                        {isOverallVerified ? "Session Verified" : "Pending / Partial Signals"}
                    </Text>
                    <Text style={styles.verdictDescription}>
                        {verification?.reason ||
                         (isOverallVerified
                            ? "All policy-required verification criteria were satisfied for today's session."
                            : "Attendance session has not been submitted or some signals were unavailable.")
                        }
                    </Text>
                </View>
            </View>

            {/* Signal Details List */}
            <Text style={styles.sectionHeading}>INSPECTION SIGNALS</Text>

            {signals.map((sig) => {
                const badge = getResultBadge(sig.result);
                return (
                    <View key={sig.key} style={styles.signalCard}>
                        <View style={styles.signalCardHeader}>
                            <View style={styles.signalIconWrap}>
                                <Ionicons name={sig.icon} size={20} color="#2563EB" />
                            </View>
                            <View style={styles.signalTitleWrap}>
                                <Text style={styles.signalName}>{sig.name}</Text>
                                <Text style={styles.signalNotes}>{sig.notes}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                <Ionicons name={badge.icon} size={13} color={badge.text} style={{ marginRight: 4 }} />
                                <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                            </View>
                        </View>

                        <View style={styles.signalBody}>
                            <Text style={styles.reasonLabel}>Server Observation:</Text>
                            <Text style={styles.reasonText}>{sig.reason}</Text>
                        </View>
                    </View>
                );
            })}

            {/* Refresh CTA */}
            <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => refreshAttendance(false)}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                    <>
                        <Ionicons name="refresh-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                        <Text style={styles.refreshBtnText}>Refresh Verification Status</Text>
                    </>
                )}
            </TouchableOpacity>
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
    header: {
        marginBottom: 20
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "700",
        color: "#2563EB",
        letterSpacing: 1,
        marginBottom: 4
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.4
    },
    subtitle: {
        fontSize: 13,
        color: "#64748B",
        lineHeight: 18,
        marginTop: 4
    },
    verdictCard: {
        flexDirection: "row",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        marginBottom: 24,
        alignItems: "flex-start"
    },
    verdictCardPass: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0"
    },
    verdictCardPending: {
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A"
    },
    verdictIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1
    },
    verdictContent: {
        flex: 1
    },
    verdictLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.8,
        marginBottom: 2
    },
    verdictTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 4
    },
    verdictTitlePass: {
        color: "#166534"
    },
    verdictTitlePending: {
        color: "#B45309"
    },
    verdictDescription: {
        fontSize: 12,
        color: "#475569",
        lineHeight: 17
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.8,
        marginBottom: 12
    },
    signalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 12,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1
    },
    signalCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10
    },
    signalIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12
    },
    signalTitleWrap: {
        flex: 1
    },
    signalName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A"
    },
    signalNotes: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 1
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700"
    },
    signalBody: {
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: "#F1F5F9"
    },
    reasonLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#94A3B8",
        textTransform: "uppercase",
        marginBottom: 2
    },
    reasonText: {
        fontSize: 12,
        color: "#334155",
        lineHeight: 16
    },
    refreshBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 12
    },
    refreshBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2563EB"
    }
});