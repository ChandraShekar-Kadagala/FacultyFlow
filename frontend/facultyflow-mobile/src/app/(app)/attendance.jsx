import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import { useState } from "react";

import useAuth from "../../hooks/useAuth";
import { useAttendance } from "../../context/AttendanceContext";

export default function Attendance() {
    const { user } = useAuth();

    const {
        attendance,
        processing,
        performCheckIn,
        performCheckOut,
        resetAttendance
    } = useAttendance();

    const [refreshing, setRefreshing] =
        useState(false);

    const isCheckedIn =
        attendance?.status === "CHECKED_IN" ||
        attendance?.status === "PRESENT";

    const isCheckedOut =
        attendance?.status === "CHECKED_OUT";

    const canCheckIn =
        !isCheckedIn &&
        !isCheckedOut &&
        !processing;

    const canCheckOut =
        isCheckedIn &&
        !isCheckedOut &&
        !processing;

    async function handleCheckIn() {
        if (!user || !canCheckIn) {
            return;
        }

        await performCheckIn(user);
    }

    async function handleCheckOut() {
        if (!user || !canCheckOut) {
            return;
        }

        await performCheckOut(user);
    }

    async function handleRefresh() {
        setRefreshing(true);

        await new Promise(resolve => {
            setTimeout(resolve, 700);
        });

        setRefreshing(false);
    }

    function getStatusTitle() {
        if (isCheckedOut) {
            return "Attendance completed";
        }

        if (isCheckedIn) {
            return "You are checked in";
        }

        return "Ready to check in";
    }

    function getStatusDescription() {
        if (isCheckedOut) {
            return "Your attendance for today has been completed.";
        }

        if (isCheckedIn) {
            return "Your check-in has been recorded. Complete check-out when you leave.";
        }

        return "Complete the required verification checks before recording attendance.";
    }

    function getStatusColor() {
        if (isCheckedOut) {
            return "#16A34A";
        }

        if (isCheckedIn) {
            return "#2563EB";
        }

        return "#64748B";
    }

    function formatValue(value) {
        if (!value) {
            return "--";
        }

        return value;
    }

    return (
        <View style={styles.screen}>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
            >

                <View style={styles.header}>

                    <View>
                        <Text style={styles.eyebrow}>
                            ATTENDANCE
                        </Text>

                        <Text style={styles.title}>
                            Today&apos;s Attendance
                        </Text>

                        <Text style={styles.subtitle}>
                            Record and monitor your attendance securely.
                        </Text>
                    </View>

                    <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>
                            TODAY
                        </Text>
                    </View>

                </View>

                <View style={styles.statusCard}>

                    <View
                        style={[
                            styles.statusIndicator,
                            {
                                backgroundColor:
                                    getStatusColor()
                            }
                        ]}
                    />

                    <View style={styles.statusContent}>

                        <Text style={styles.statusLabel}>
                            CURRENT STATUS
                        </Text>

                        <Text style={styles.statusTitle}>
                            {getStatusTitle()}
                        </Text>

                        <Text style={styles.statusDescription}>
                            {getStatusDescription()}
                        </Text>

                    </View>

                </View>

                <View style={styles.timeGrid}>

                    <View style={styles.timeCard}>
                        <Text style={styles.timeLabel}>
                            CHECK IN
                        </Text>

                        <Text style={styles.timeValue}>
                            {formatValue(
                                attendance?.checkInTime
                            )}
                        </Text>
                    </View>

                    <View style={styles.timeCard}>
                        <Text style={styles.timeLabel}>
                            CHECK OUT
                        </Text>

                        <Text style={styles.timeValue}>
                            {formatValue(
                                attendance?.checkOutTime
                            )}
                        </Text>
                    </View>

                </View>

                <View style={styles.verificationCard}>

                    <View style={styles.sectionHeader}>

                        <View>
                            <Text style={styles.sectionEyebrow}>
                                VERIFICATION
                            </Text>

                            <Text style={styles.sectionTitle}>
                                Attendance checks
                            </Text>
                        </View>

                        <View style={styles.demoBadge}>
                            <Text style={styles.demoBadgeText}>
                                ACTIVE
                            </Text>
                        </View>

                    </View>

                    <Text style={styles.verificationDescription}>
                        Required verification signals are evaluated
                        before attendance is recorded.
                    </Text>

                    <VerificationRow
                        label="Identity"
                        value={
                            attendance?.lastVerification
                                ?.identity
                        }
                    />

                    <VerificationRow
                        label="Schedule"
                        value={
                            attendance?.lastVerification
                                ?.schedule
                        }
                    />

                    <VerificationRow
                        label="Overall verification"
                        value={
                            attendance?.lastVerification
                                ?.overall
                        }
                        last
                    />

                </View>

                {attendance?.lastError && (
                    <View style={styles.errorCard}>

                        <Text style={styles.errorLabel}>
                            ATTENDANCE ACTION
                        </Text>

                        <Text style={styles.errorTitle}>
                            Action could not be completed
                        </Text>

                        <Text style={styles.errorMessage}>
                            {attendance.lastError}
                        </Text>

                    </View>
                )}

                <View style={styles.actionCard}>

                    <Text style={styles.actionEyebrow}>
                        ATTENDANCE ACTION
                    </Text>

                    <Text style={styles.actionTitle}>
                        {getStatusTitle()}
                    </Text>

                    <Text style={styles.actionDescription}>
                        {getStatusDescription()}
                    </Text>

                    <View style={styles.actionButtons}>

                        <Pressable
                            onPress={handleCheckIn}
                            disabled={!canCheckIn}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                !canCheckIn &&
                                    styles.disabledButton,
                                pressed &&
                                    canCheckIn &&
                                    styles.pressedButton
                            ]}
                        >

                            {processing ? (
                                <ActivityIndicator
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Text
                                    style={
                                        styles.primaryButtonText
                                    }
                                >
                                    Check In
                                </Text>
                            )}

                        </Pressable>

                        <Pressable
                            onPress={handleCheckOut}
                            disabled={!canCheckOut}
                            style={({ pressed }) => [
                                styles.secondaryButton,
                                !canCheckOut &&
                                    styles.disabledSecondaryButton,
                                pressed &&
                                    canCheckOut &&
                                    styles.pressedSecondaryButton
                            ]}
                        >

                            <Text
                                style={
                                    !canCheckOut
                                        ? styles.disabledSecondaryText
                                        : styles.secondaryButtonText
                                }
                            >
                                Check Out
                            </Text>

                        </Pressable>

                    </View>

                </View>

                <View style={styles.syncCard}>

                    <View>
                        <Text style={styles.syncLabel}>
                            SYNC STATUS
                        </Text>

                        <Text style={styles.syncValue}>
                            {attendance?.syncStatus ||
                                "LOCAL"}
                        </Text>
                    </View>

                    <View style={styles.syncDot} />

                </View>

                {isCheckedOut && (
                    <Pressable
                        onPress={resetAttendance}
                        style={styles.resetButton}
                    >
                        <Text style={styles.resetText}>
                            Reset Demo Attendance
                        </Text>
                    </Pressable>
                )}

                <View style={styles.securityNote}>

                    <Text style={styles.securityTitle}>
                        FacultyFlow security
                    </Text>

                    <Text style={styles.securityText}>
                        Attendance decisions will be
                        authoritative on the backend in the
                        production architecture. Device and
                        verification signals shown here are
                        part of the current application layer.
                    </Text>

                </View>

            </ScrollView>

        </View>
    );
}

function VerificationRow({
    label,
    value,
    last = false
}) {
    const passed = value === true;

    const failed =
        value === false;

    const statusText =
        passed
            ? "Passed"
            : failed
                ? "Failed"
                : "Pending";

    const statusStyle =
        passed
            ? styles.verificationPassed
            : failed
                ? styles.verificationFailed
                : styles.verificationPending;

    return (
        <View
            style={[
                styles.verificationRow,
                !last && styles.verificationRowBorder
            ]}
        >

            <View style={styles.verificationLeft}>

                <View
                    style={[
                        styles.verificationDot,
                        passed &&
                            styles.verificationDotPassed,
                        failed &&
                            styles.verificationDotFailed,
                        !passed &&
                            !failed &&
                            styles.verificationDotPending
                    ]}
                />

                <Text style={styles.verificationName}>
                    {label}
                </Text>

            </View>

            <Text
                style={[
                    styles.verificationStatus,
                    statusStyle
                ]}
            >
                {statusText}
            </Text>

        </View>
    );
}

const styles = StyleSheet.create({

    screen: {
        flex: 1,
        backgroundColor: "#F4F7FB"
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 22
    },

    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
        color: "#2563EB",
        marginBottom: 6
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6
    },

    subtitle: {
        maxWidth: 300,
        fontSize: 14,
        lineHeight: 21,
        color: "#64748B"
    },

    dateBadge: {
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "#E8F0FF",
        borderWidth: 1,
        borderColor: "#C9DBFF"
    },

    dateBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
        color: "#2563EB"
    },

    statusCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 14,
        shadowColor: "#0F172A",
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2
    },

    statusIndicator: {
        width: 12,
        height: 56,
        borderRadius: 8,
        marginRight: 15
    },

    statusContent: {
        flex: 1
    },

    statusLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        color: "#94A3B8",
        marginBottom: 4
    },

    statusTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 5
    },

    statusDescription: {
        fontSize: 13,
        lineHeight: 19,
        color: "#64748B"
    },

    timeGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 14
    },

    timeCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 17,
        borderWidth: 1,
        borderColor: "#E2E8F0"
    },

    timeLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.1,
        color: "#94A3B8",
        marginBottom: 8
    },

    timeValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A"
    },

    verificationCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 14
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8
    },

    sectionEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        color: "#2563EB",
        marginBottom: 4
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A"
    },

    demoBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#DCFCE7"
    },

    demoBadgeText: {
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.8,
        color: "#15803D"
    },

    verificationDescription: {
        fontSize: 13,
        lineHeight: 19,
        color: "#64748B",
        marginBottom: 8
    },

    verificationRow: {
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },

    verificationRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#EEF2F7"
    },

    verificationLeft: {
        flexDirection: "row",
        alignItems: "center"
    },

    verificationDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 10
    },

    verificationDotPassed: {
        backgroundColor: "#16A34A"
    },

    verificationDotFailed: {
        backgroundColor: "#DC2626"
    },

    verificationDotPending: {
        backgroundColor: "#CBD5E1"
    },

    verificationName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155"
    },

    verificationStatus: {
        fontSize: 12,
        fontWeight: "700"
    },

    verificationPassed: {
        color: "#15803D"
    },

    verificationFailed: {
        color: "#DC2626"
    },

    verificationPending: {
        color: "#94A3B8"
    },

    errorCard: {
        backgroundColor: "#FFF7F7",
        borderRadius: 16,
        padding: 17,
        borderWidth: 1,
        borderColor: "#FECACA",
        marginBottom: 14
    },

    errorLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.1,
        color: "#DC2626",
        marginBottom: 5
    },

    errorTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#991B1B",
        marginBottom: 4
    },

    errorMessage: {
        fontSize: 13,
        lineHeight: 19,
        color: "#B91C1C"
    },

    actionCard: {
        backgroundColor: "#0F172A",
        borderRadius: 20,
        padding: 20,
        marginBottom: 14
    },

    actionEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        color: "#93C5FD",
        marginBottom: 6
    },

    actionTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
        marginBottom: 6
    },

    actionDescription: {
        fontSize: 13,
        lineHeight: 19,
        color: "#CBD5E1",
        marginBottom: 18
    },

    actionButtons: {
        gap: 10
    },

    primaryButton: {
        minHeight: 52,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB"
    },

    primaryButtonText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#FFFFFF"
    },

    secondaryButton: {
        minHeight: 52,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CBD5E1"
    },

    secondaryButtonText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0F172A"
    },

    disabledButton: {
        backgroundColor: "#475569"
    },

    disabledSecondaryButton: {
        backgroundColor: "#E2E8F0",
        borderColor: "#E2E8F0"
    },

    disabledSecondaryText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#94A3B8"
    },

    pressedButton: {
        opacity: 0.85
    },

    pressedSecondaryButton: {
        backgroundColor: "#F1F5F9"
    },

    syncCard: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        paddingHorizontal: 17,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 14
    },

    syncLabel: {
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 1.1,
        color: "#94A3B8",
        marginBottom: 3
    },

    syncValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155"
    },

    syncDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#16A34A"
    },

    resetButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 46,
        marginBottom: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        backgroundColor: "#FFFFFF"
    },

    resetText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B"
    },

    securityNote: {
        padding: 16,
        borderRadius: 15,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#DBEAFE"
    },

    securityTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#1D4ED8",
        marginBottom: 5
    },

    securityText: {
        fontSize: 12,
        lineHeight: 18,
        color: "#475569"
    }

});