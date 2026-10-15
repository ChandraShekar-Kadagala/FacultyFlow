import { useState, useEffect } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";
import SyncStatus from "../../components/SyncStatus";
import CheckInVerificationModal from "../../components/CheckInVerificationModal";
import { calculateWorkingDuration } from "../../services/attendance/durationUtils";

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
    if (!dateStr) return new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    } catch (_err) {
        return dateStr;
    }
}

export default function HomeScreen() {
    const { user } = useAuth();
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
        verificationStatus,
        refreshAttendance,
        clearMessages
    } = useAttendance();

    const [, setTick] = useState(0);
    useEffect(() => {
        if (!isCheckedIn || isCheckedOut) return;
        const interval = setInterval(() => setTick((t) => t + 1), 10000);
        return () => clearInterval(interval);
    }, [isCheckedIn, isCheckedOut]);

    const durationInfo = attendance?.checkInTime
        ? calculateWorkingDuration(attendance.checkInTime, attendance.checkOutTime)
        : null;

    const isVerified = verificationStatus === "Verified" || verificationStatus === "VERIFIED";
    const [verificationModalVisible, setVerificationModalVisible] = useState(false);
    const [verificationModalMode, setVerificationModalMode] = useState("check_in");

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
                <View style={styles.welcomeContainer}>
                    <Text style={styles.greeting}>Good day,</Text>
                    <Text style={styles.name}>{user?.name || "Faculty Member"}</Text>
                    {user?.department ? (
                        <Text style={styles.department}>{user.department}</Text>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => router.push("/(app)/profile")}
                    activeOpacity={0.8}
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>
                            {(user?.name || "F").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Success Banner */}
            {successMessage ? (
                <View style={styles.successCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#16A34A" style={styles.bannerIcon} />
                    <View style={styles.bannerContent}>
                        <Text style={styles.successTitle}>Success</Text>
                        <Text style={styles.successMessage}>{successMessage}</Text>
                    </View>
                    <TouchableOpacity onPress={clearMessages} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={20} color="#16A34A" />
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Error Banner */}
            {error ? (
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" style={styles.bannerIcon} />
                    <View style={styles.bannerContent}>
                        <Text style={styles.errorTitle}>Attendance Notice</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                    </View>
                    <TouchableOpacity onPress={clearMessages} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Offline Sync Status Card */}
            <SyncStatus />

            {/* Main Attendance Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <View>
                        <Text style={styles.cardLabel}>TODAY&apos;S ATTENDANCE</Text>
                        <Text style={styles.cardDate}>
                            {formatDateString(attendance?.date)}
                        </Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                    ) : isCheckedIn ? (
                        <View style={[
                            styles.badge,
                            attendance?.syncStatus === "PENDING_SYNC"
                                ? styles.amberBadge
                                : isCheckedOut ? styles.greenBadge : styles.blueBadge
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                attendance?.syncStatus === "PENDING_SYNC"
                                    ? styles.amberBadgeText
                                    : isCheckedOut ? styles.greenBadgeText : styles.blueBadgeText
                            ]}>
                                {attendance?.syncStatus === "PENDING_SYNC"
                                    ? "PENDING SYNC"
                                    : isCheckedOut
                                        ? "COMPLETED"
                                        : "SESSION ACTIVE"}
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, styles.grayBadge]}>
                            <Text style={[styles.badgeText, styles.grayBadgeText]}>
                                NOT CHECKED IN
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563EB" style={{ marginBottom: 8 }} />
                        <Text style={styles.loadingText}>Fetching attendance record...</Text>
                    </View>
                ) : !isCheckedIn ? (
                    /* State 1: Not checked in yet */
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="finger-print-outline" size={34} color="#2563EB" />
                        </View>
                        <Text style={styles.emptyTitle}>Ready to Check In</Text>
                        <Text style={styles.emptySubtitle}>
                            Your check-in has not been recorded for today. Tap below to capture observations and check in.
                        </Text>

                        <TouchableOpacity
                            style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                            onPress={() => {
                                setVerificationModalMode("check_in");
                                setVerificationModalVisible(true);
                            }}
                            disabled={!canCheckIn}
                            activeOpacity={0.8}
                        >
                            {actionLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.actionBtnText}>Verifying &amp; Checking In...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.actionBtnText}>Check In Now</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </View>
                ) : (
                    /* State 2 & 3: Checked in (active session) or Completed */
                    <>
                        <View style={styles.timeRow}>
                            <View style={styles.timeCol}>
                                <Text style={styles.timeLabel}>Check In</Text>
                                <Text style={styles.timeValue}>
                                    {formatTimeString(attendance?.checkInTime)}
                                </Text>
                            </View>

                            <View style={styles.timeCol}>
                                <Text style={styles.timeLabel}>Check Out</Text>
                                <Text style={styles.timeValue}>
                                    {isCheckedOut
                                        ? formatTimeString(attendance?.checkOutTime)
                                        : "In Progress"
                                    }
                                </Text>
                            </View>

                            <View style={styles.timeCol}>
                                <Text style={styles.timeLabel}>
                                    {isCheckedOut ? "Duration" : "Live Elapsed"}
                                </Text>
                                <Text style={[
                                    styles.timeValue,
                                    { color: isCheckedOut ? "#16A34A" : "#2563EB" }
                                ]}>
                                    {isCheckedOut
                                        ? (attendance?.workingDurationFormatted || durationInfo?.formatted || "—")
                                        : `${durationInfo?.formatted || "< 1 min"}`
                                    }
                                </Text>
                            </View>
                        </View>

                        {/* Verification Pill */}
                        <TouchableOpacity
                            style={styles.verificationPillRow}
                            onPress={() => router.push("/(app)/verification")}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isVerified ? "shield-checkmark" : "shield-outline"}
                                size={16}
                                color={isVerified ? "#16A34A" : "#D97706"}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={styles.verificationPillLabel}>Verification:</Text>
                            <Text style={[
                                styles.verificationPillValue,
                                isVerified ? styles.verificationPillVerified : styles.verificationPillPending
                            ]}>
                                {isVerified ? "Verified by Server" : "Pending / Partial"}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: "auto" }} />
                        </TouchableOpacity>

                        {/* Check-Out Action Button */}
                        <View style={{ marginTop: 16 }}>
                            {isCheckedOut ? (
                                <View style={styles.completedNotice}>
                                    <Ionicons name="checkmark-done-circle" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                                    <Text style={styles.completedNoticeText}>
                                        Attendance cycle completed ({attendance?.workingDurationFormatted || durationInfo?.formatted || "—"}).
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.checkoutActionBtn, actionLoading && styles.btnDisabled]}
                                    onPress={() => {
                                        setVerificationModalMode("check_out");
                                        setVerificationModalVisible(true);
                                    }}
                                    disabled={!canCheckOut}
                                    activeOpacity={0.8}
                                >
                                    {actionLoading ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.actionBtnText}>Recording Check-Out...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.actionBtnText}>Check Out Now</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}
            </View>

            {/* Quick Navigation Cards */}
            <View style={styles.quickNavRow}>
                <TouchableOpacity
                    style={styles.quickNavCard}
                    onPress={() => router.push("/(app)/verification")}
                    activeOpacity={0.8}
                >
                    <View style={[styles.quickNavIconBox, { backgroundColor: "#EFF6FF" }]}>
                        <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
                    </View>
                    <View style={styles.quickNavTextBox}>
                        <Text style={styles.quickNavTitle}>Security &amp; Signals</Text>
                        <Text style={styles.quickNavSubtitle}>View verification events</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickNavCard}
                    onPress={() => router.push("/(app)/history")}
                    activeOpacity={0.8}
                >
                    <View style={[styles.quickNavIconBox, { backgroundColor: "#F0FDF4" }]}>
                        <Ionicons name="time-outline" size={22} color="#16A34A" />
                    </View>
                    <View style={styles.quickNavTextBox}>
                        <Text style={styles.quickNavTitle}>Attendance History</Text>
                        <Text style={styles.quickNavSubtitle}>Past recorded days</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </ScrollView>

        <CheckInVerificationModal
            visible={verificationModalVisible}
            mode={verificationModalMode}
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    welcomeContainer: {
        flex: 1
    },
    greeting: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748B",
        marginBottom: 2
    },
    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.3
    },
    department: {
        fontSize: 13,
        fontWeight: "500",
        color: "#2563EB",
        marginTop: 2
    },
    profileButton: {
        marginLeft: 12
    },
    profileAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3
    },
    profileAvatarText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    successCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    bannerIcon: {
        marginRight: 10
    },
    bannerContent: {
        flex: 1
    },
    successTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#166534"
    },
    successMessage: {
        fontSize: 12,
        fontWeight: "500",
        color: "#15803D",
        marginTop: 1
    },
    errorCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    errorTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#991B1B"
    },
    errorMessage: {
        fontSize: 12,
        fontWeight: "500",
        color: "#B91C1C",
        marginTop: 1
    },
    statusCard: {
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
    statusHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 0.8,
        marginBottom: 4
    },
    cardDate: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A"
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700"
    },
    greenBadge: {
        backgroundColor: "#DCFCE7"
    },
    greenBadgeText: {
        color: "#15803D"
    },
    blueBadge: {
        backgroundColor: "#DBEAFE"
    },
    blueBadgeText: {
        color: "#1D4ED8"
    },
    amberBadge: {
        backgroundColor: "#FEF3C7"
    },
    amberBadgeText: {
        color: "#B45309"
    },
    grayBadge: {
        backgroundColor: "#F1F5F9"
    },
    grayBadgeText: {
        color: "#64748B"
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 16
    },
    loadingContainer: {
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center"
    },
    loadingText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500"
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 12
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 6
    },
    emptySubtitle: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 16,
        marginBottom: 18
    },
    primaryActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 24,
        width: "100%",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3
    },
    checkoutActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EA580C",
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 24,
        width: "100%",
        shadowColor: "#EA580C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3
    },
    btnDisabled: {
        opacity: 0.65
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14
    },
    timeCol: {
        flex: 1
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748B",
        marginBottom: 4
    },
    timeValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A"
    },
    verificationPillRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    verificationPillLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748B",
        marginRight: 6
    },
    verificationPillValue: {
        fontSize: 12,
        fontWeight: "700"
    },
    verificationPillVerified: {
        color: "#16A34A"
    },
    verificationPillPending: {
        color: "#D97706"
    },
    completedNotice: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F0FDF4",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#BBF7D0"
    },
    completedNoticeText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#166534"
    },
    quickNavRow: {
        gap: 12
    },
    quickNavCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    quickNavIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12
    },
    quickNavTextBox: {
        flex: 1
    },
    quickNavTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A"
    },
    quickNavSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 1
    }
});