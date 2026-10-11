import {
    useCallback,
    useEffect,
    useState
} from "react";
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

import { useAuth } from "../../context/AuthContext";
import { getAttendanceHistory } from "../../services/attendance/attendanceApi";

function formatTimeString(isoString) {
    if (!isoString) return "Not Recorded";
    try {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return isoString;
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (_err) {
        return isoString;
    }
}

function formatDateString(dateStr) {
    if (!dateStr) return "Unknown Date";
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch (_err) {
        return dateStr;
    }
}

export default function HistoryScreen() {
    const { accessToken } = useAuth();

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadHistory = useCallback(async (isRefresh = false) => {
        if (!accessToken) return;

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await getAttendanceHistory(accessToken);
            if (response?.success && Array.isArray(response.records)) {
                setRecords(response.records);
            } else {
                setRecords([]);
            }
        } catch (err) {
            console.error("Failed to load attendance history:", err);
            setError(err?.message || "Unable to retrieve attendance history from the server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [accessToken]);

    useEffect(() => {
        loadHistory(false);
    }, [loadHistory]);

    const totalDays = records.length;
    const presentCount = records.filter(r => r.status === "Present").length;
    const lateCount = records.filter(r => r.status === "Late").length;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadHistory(true)}
                    tintColor="#2563EB"
                    colors={["#2563EB"]}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.eyebrow}>ATTENDANCE LOG</Text>
                <Text style={styles.title}>History &amp; Records</Text>
                <Text style={styles.subtitle}>
                    Authoritative attendance records retrieved directly from the institutional database.
                </Text>
            </View>

            {/* Metrics Overview */}
            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{totalDays}</Text>
                    <Text style={styles.metricLabel}>Total Sessions</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={[styles.metricValue, { color: "#16A34A" }]}>{presentCount}</Text>
                    <Text style={styles.metricLabel}>Present</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={[styles.metricValue, { color: "#D97706" }]}>{lateCount}</Text>
                    <Text style={styles.metricLabel}>Late</Text>
                </View>
            </View>

            {/* Error State */}
            {error ? (
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.errorTitle}>Failed to Load History</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => loadHistory(false)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.retryBtnText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {/* Loading State */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginBottom: 10 }} />
                    <Text style={styles.loadingText}>Fetching attendance history from database...</Text>
                </View>
            ) : records.length === 0 && !error ? (
                /* Empty State */
                <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>No Past Records Found</Text>
                    <Text style={styles.emptySubtitle}>
                        You do not have any recorded attendance sessions in the database yet.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyCtaBtn}
                        onPress={() => router.push("/(app)/attendance")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="finger-print-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.emptyCtaBtnText}>Check In Today</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* List of Records */
                <View style={styles.recordsList}>
                    {records.map((record) => {
                        const isPresent = record.status === "Present";
                        const isLate = record.status === "Late";
                        const isVerified = (record.verificationStatus || "").toLowerCase() === "verified";

                        return (
                            <View key={record.attendanceId || record._id} style={styles.recordCard}>
                                <View style={styles.recordHeader}>
                                    <View>
                                        <Text style={styles.recordDate}>{formatDateString(record.date)}</Text>
                                        <Text style={styles.recordId}>ID: {record.attendanceId || "REC"}</Text>
                                    </View>

                                    <View style={[
                                        styles.statusBadge,
                                        isPresent ? styles.greenBadge : isLate ? styles.amberBadge : styles.grayBadge
                                    ]}>
                                        <Text style={[
                                            styles.statusBadgeText,
                                            isPresent ? styles.greenBadgeText : isLate ? styles.amberBadgeText : styles.grayBadgeText
                                        ]}>
                                            {(record.status || "PRESENT").toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.recordDivider} />

                                <View style={styles.recordTimesRow}>
                                    <View style={styles.recordTimeCol}>
                                        <Text style={styles.timeLabel}>Check-In</Text>
                                        <Text style={styles.timeValue}>{formatTimeString(record.checkInTime)}</Text>
                                    </View>

                                    <View style={styles.recordTimeCol}>
                                        <Text style={styles.timeLabel}>Check-Out</Text>
                                        <Text style={styles.timeValue}>{formatTimeString(record.checkOutTime)}</Text>
                                    </View>
                                </View>

                                <View style={styles.recordFooter}>
                                    <View style={styles.verificationPill}>
                                        <Ionicons
                                            name={isVerified ? "shield-checkmark" : "shield-outline"}
                                            size={13}
                                            color={isVerified ? "#16A34A" : "#D97706"}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.verificationPillText, { color: isVerified ? "#16A34A" : "#D97706" }]}>
                                            {isVerified ? "Verified" : "Pending Verification"}
                                        </Text>
                                    </View>

                                    <Text style={styles.sourceLabel}>
                                        Source: {record.source || "MOBILE"}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
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
    metricsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20
    },
    metricCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1
    },
    metricValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 2
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748B"
    },
    errorCard: {
        flexDirection: "row",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16
    },
    errorTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#991B1B"
    },
    errorMessage: {
        fontSize: 12,
        color: "#B91C1C",
        marginTop: 2,
        marginBottom: 10
    },
    retryBtn: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "#DC2626",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    retryBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center"
    },
    loadingText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748B"
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginTop: 10
    },
    emptyIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14
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
        marginBottom: 18,
        paddingHorizontal: 12
    },
    emptyCtaBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20
    },
    emptyCtaBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    recordsList: {
        gap: 12
    },
    recordCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1
    },
    recordHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start"
    },
    recordDate: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A"
    },
    recordId: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: "500",
        marginTop: 1
    },
    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 16
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "700"
    },
    greenBadge: {
        backgroundColor: "#DCFCE7"
    },
    greenBadgeText: {
        color: "#15803D"
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
    recordDivider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 12
    },
    recordTimesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },
    recordTimeCol: {
        flex: 1
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748B",
        marginBottom: 2
    },
    timeValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A"
    },
    recordFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    verificationPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },
    verificationPillText: {
        fontSize: 11,
        fontWeight: "600"
    },
    sourceLabel: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: "500"
    }
});