import { useState } from "react";
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
import { router } from "expo-router";

import { useAttendance } from "../../context/AttendanceContext";
import SyncStatus from "../../components/SyncStatus";
import CheckInVerificationModal from "../../components/CheckInVerificationModal";

function formatTimeString(isoString) {
    if (!isoString) return "—";
    try {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return isoString;
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (_err) {
        return isoString;
    }
}

function formatDateString(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    } catch (_err) {
        return dateStr;
    }
}

export default function AttendanceScreen() {
    const {
        attendance,
        loading,
        actionLoading,
        error,
        successMessage,
        isCheckedIn,
        isCheckedOut,
        canCheckIn,
        canCheckOut,
        attendanceStatus,
        verificationStatus,
        refreshAttendance,
        performCheckOut,
        clearMessages
    } = useAttendance();

    const isVerified = verificationStatus === "Verified" || verificationStatus === "VERIFIED";
    const [verificationModalVisible, setVerificationModalVisible] = useState(false);

    return (
        <View style={styles.root}>
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
                <Text style={styles.eyebrow}>FACULTY WORKFLOW</Text>
                <Text style={styles.title}>Mark Attendance</Text>
                <Text style={styles.subtitle}>
                    Record your daily presence and complete check-out under institutional policy.
                </Text>
            </View>

            {/* Success Message Banner */}
            {successMessage ? (
                <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={22} color="#16A34A" style={{ marginRight: 8 }} />
                    <Text style={styles.successBannerText}>{successMessage}</Text>
                    <TouchableOpacity onPress={clearMessages} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={18} color="#16A34A" />
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Error Message Banner */}
            {error ? (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={22} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{error}</Text>
                    <TouchableOpacity onPress={clearMessages} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Offline Sync Status Card */}
            <SyncStatus />

            {/* Active Status Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.sessionLabel}>SESSION DATE</Text>
                        <Text style={styles.sessionDate}>{formatDateString(attendance?.date)}</Text>
                    </View>
                    <View style={[
                        styles.statusPill,
                        attendance?.syncStatus === "PENDING_SYNC" ? styles.amberPill :
                        attendanceStatus === "Present" ? styles.greenPill :
                        attendanceStatus === "Late" ? styles.amberPill : styles.grayPill
                    ]}>
                        <Text style={[
                            styles.statusPillText,
                            attendance?.syncStatus === "PENDING_SYNC" ? styles.amberPillText :
                            attendanceStatus === "Present" ? styles.greenPillText :
                            attendanceStatus === "Late" ? styles.amberPillText : styles.grayPillText
                        ]}>
                            {attendance?.syncStatus === "PENDING_SYNC" ? "PENDING SYNC" : attendanceStatus.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Timestamps */}
                <View style={styles.timestampsGrid}>
                    <View style={styles.timeBox}>
                        <View style={styles.timeIconWrap}>
                            <Ionicons name="log-in-outline" size={18} color="#2563EB" />
                        </View>
                        <View>
                            <Text style={styles.timeBoxLabel}>Check-In Time</Text>
                            <Text style={styles.timeBoxValue}>{formatTimeString(attendance?.checkInTime)}</Text>
                        </View>
                    </View>

                    <View style={styles.timeBox}>
                        <View style={[styles.timeIconWrap, { backgroundColor: isCheckedOut ? "#FEF3C7" : "#F1F5F9" }]}>
                            <Ionicons name="log-out-outline" size={18} color={isCheckedOut ? "#D97706" : "#94A3B8"} />
                        </View>
                        <View>
                            <Text style={styles.timeBoxLabel}>Check-Out Time</Text>
                            <Text style={styles.timeBoxValue}>{formatTimeString(attendance?.checkOutTime)}</Text>
                        </View>
                    </View>
                </View>

                {/* Security Verification Link */}
                <TouchableOpacity
                    style={styles.verificationBar}
                    onPress={() => router.push("/(app)/verification")}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isVerified ? "shield-checkmark" : "shield-outline"}
                        size={18}
                        color={isVerified ? "#16A34A" : "#D97706"}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.verificationBarLabel}>Security Verification:</Text>
                    <Text style={[styles.verificationBarStatus, { color: isVerified ? "#16A34A" : "#D97706" }]}>
                        {isVerified ? "Verified (Server Confirmed)" : "Pending / Partial"}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: "auto" }} />
                </TouchableOpacity>

                {/* Action Buttons based on Attendance State Machine */}
                <View style={styles.actionsContainer}>
                    {loading ? (
                        <View style={styles.btnLoadingWrap}>
                            <ActivityIndicator size="small" color="#2563EB" />
                            <Text style={styles.btnLoadingText}>Syncing attendance status...</Text>
                        </View>
                    ) : !isCheckedIn ? (
                        <TouchableOpacity
                            style={[styles.primaryBtn, actionLoading && styles.btnDisabled]}
                            onPress={() => setVerificationModalVisible(true)}
                            disabled={!canCheckIn}
                            activeOpacity={0.8}
                        >
                            {actionLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnText}>Verifying Signals &amp; Checking In...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnText}>Submit Check-In</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    ) : !isCheckedOut ? (
                        <TouchableOpacity
                            style={[styles.checkoutBtn, actionLoading && styles.btnDisabled]}
                            onPress={performCheckOut}
                            disabled={!canCheckOut}
                            activeOpacity={0.8}
                        >
                            {actionLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnText}>Submitting Check-Out...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="log-out-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnText}>Submit Check-Out</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.allDoneBox}>
                            <Ionicons name="checkmark-done-circle" size={24} color="#16A34A" style={{ marginRight: 8 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.allDoneTitle}>Attendance Completed</Text>
                                <Text style={styles.allDoneSubtitle}>
                                    Both check-in and check-out have been recorded for today.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Attendance Policy Guidance */}
            <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                    <Ionicons name="information-circle-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                    <Text style={styles.policyTitle}>Policy Guidelines</Text>
                </View>
                <Text style={styles.policyItem}>
                  • Check-in is evaluated against institution schedule windows (default 09:30 - 17:00).
                </Text>
                <Text style={styles.policyItem}>
                  • Timestamps are authoritatively assigned by the server at the moment of request.
                </Text>
                <Text style={styles.policyItem}>
                  • Check-out can only be recorded once per day following a confirmed check-in.
                </Text>
            </View>
        </ScrollView>

        <CheckInVerificationModal
            visible={verificationModalVisible}
            onClose={() => setVerificationModalVisible(false)}
            onComplete={() => {
                setVerificationModalVisible(false);
                refreshAttendance(true);
            }}
        />
    </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#F8FAFC"
    },
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
    successBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    successBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: "#166534"
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    errorBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: "#991B1B"
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 20,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    sessionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.8
    },
    sessionDate: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 2
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: "700"
    },
    greenPill: {
        backgroundColor: "#DCFCE7"
    },
    greenPillText: {
        color: "#15803D"
    },
    amberPill: {
        backgroundColor: "#FEF3C7"
    },
    amberPillText: {
        color: "#B45309"
    },
    grayPill: {
        backgroundColor: "#F1F5F9"
    },
    grayPillText: {
        color: "#64748B"
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 16
    },
    timestampsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16
    },
    timeBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    timeIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10
    },
    timeBoxLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748B"
    },
    timeBoxValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 1
    },
    verificationBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16
    },
    verificationBarLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748B",
        marginRight: 6
    },
    verificationBarStatus: {
        fontSize: 12,
        fontWeight: "700"
    },
    actionsContainer: {
        marginTop: 4
    },
    btnLoadingWrap: {
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center"
    },
    btnLoadingText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
        marginTop: 6
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3
    },
    checkoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EA580C",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        shadowColor: "#EA580C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3
    },
    btnDisabled: {
        opacity: 0.65
    },
    btnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    allDoneBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#BBF7D0"
    },
    allDoneTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#166534"
    },
    allDoneSubtitle: {
        fontSize: 12,
        color: "#15803D",
        marginTop: 1
    },
    policyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    policyHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8
    },
    policyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A"
    },
    policyItem: {
        fontSize: 12,
        color: "#64748B",
        lineHeight: 18,
        marginBottom: 4
    }
});