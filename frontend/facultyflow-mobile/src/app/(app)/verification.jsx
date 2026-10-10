import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import useAuth from "../../hooks/useAuth";
import { runVerification } from "../../services/verification/verificationEngine";

export default function VerificationScreen() {
    const { user } = useAuth();

    const [verification, setVerification] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    async function handleVerification() {
        setLoading(true);

        const now = new Date();

        const currentTime = {
            hours: now.getHours(),
            minutes: now.getMinutes()
        };

        const result = await runVerification({
            user,
            currentTime
        });

        setVerification(result);

        setLoading(false);
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <Text style={styles.eyebrow}>
                    ATTENDANCE SECURITY
                </Text>

                <Text style={styles.title}>
                    Verification
                </Text>

                <Text style={styles.subtitle}>
                    Complete the configured checks before
                    recording attendance.
                </Text>
            </View>

            {verification && (
                <View
                    style={[
                        styles.resultCard,
                        verification.passed
                            ? styles.successCard
                            : styles.failureCard
                    ]}
                >
                    <View style={styles.resultIcon}>
                        <Ionicons
                            name={
                                verification.passed
                                    ? "checkmark-circle"
                                    : "alert-circle"
                            }
                            size={30}
                            color={
                                verification.passed
                                    ? "#16A34A"
                                    : "#DC2626"
                            }
                        />
                    </View>

                    <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>
                            {verification.passed
                                ? "Verification Passed"
                                : "Verification Not Passed"}
                        </Text>

                        <Text style={styles.resultText}>
                            {verification.passed
                                ? "All required verification checks passed."
                                : verification.reason}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Verification Checks
                </Text>

                <Text style={styles.cardSubtitle}>
                    Each check is evaluated independently.
                </Text>

                {verification?.results?.map(result => (
                    <VerificationItem
                        key={result.key}
                        result={result}
                    />
                ))}

                {!verification && (
                    <View style={styles.initialState}>
                        <Ionicons
                            name="shield-outline"
                            size={42}
                            color="#94A3B8"
                        />

                        <Text style={styles.initialTitle}>
                            Verification not started
                        </Text>

                        <Text style={styles.initialText}>
                            Tap the button below to run the
                            configured verification sequence.
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.button,
                    loading && styles.buttonDisabled
                ]}
                onPress={handleVerification}
                disabled={loading}
            >
                <Ionicons
                    name={
                        loading
                            ? "sync-outline"
                            : "shield-checkmark-outline"
                    }
                    size={20}
                    color="#FFFFFF"
                />

                <Text style={styles.buttonText}>
                    {loading
                        ? "Checking..."
                        : "Run Verification"}
                </Text>
            </TouchableOpacity>

            <View style={styles.notice}>
                <Ionicons
                    name="information-circle-outline"
                    size={21}
                    color="#2563EB"
                />

                <Text style={styles.noticeText}>
                    Device biometric, network and location
                    checks will use real platform capabilities
                    when those integrations are connected.
                </Text>
            </View>
        </ScrollView>
    );
}

function VerificationItem({ result }) {
    const isPassed =
        result.status === "passed";

    const isUnavailable =
        result.status === "unavailable";

    let iconName = "close-circle-outline";
    let iconColor = "#DC2626";
    let badgeText = "Failed";
    let badgeColor = "#FEE2E2";
    let badgeTextColor = "#B91C1C";

    if (isPassed) {
        iconName = "checkmark-circle-outline";
        iconColor = "#16A34A";
        badgeText = "Passed";
        badgeColor = "#DCFCE7";
        badgeTextColor = "#15803D";
    }

    if (isUnavailable) {
        iconName = "remove-circle-outline";
        iconColor = "#64748B";
        badgeText = "Unavailable";
        badgeColor = "#F1F5F9";
        badgeTextColor = "#475569";
    }

    return (
        <View style={styles.verificationItem}>
            <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                    <Ionicons
                        name={iconName}
                        size={22}
                        color={iconColor}
                    />
                </View>

                <View style={styles.itemText}>
                    <Text style={styles.itemTitle}>
                        {result.label}
                    </Text>

                    {result.reason && (
                        <Text style={styles.itemReason}>
                            {result.reason}
                        </Text>
                    )}
                </View>
            </View>

            <View
                style={[
                    styles.badge,
                    {
                        backgroundColor: badgeColor
                    }
                ]}
            >
                <Text
                    style={[
                        styles.badgeText,
                        {
                            color: badgeTextColor
                        }
                    ]}
                >
                    {badgeText}
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
        paddingBottom: 110
    },

    header: {
        marginBottom: 22
    },

    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
        color: "#2563EB",
        marginBottom: 6
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6
    },

    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: "#64748B"
    },

    resultCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 18
    },

    successCard: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0"
    },

    failureCard: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA"
    },

    resultIcon: {
        marginRight: 12
    },

    resultContent: {
        flex: 1
    },

    resultTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 4
    },

    resultText: {
        fontSize: 12,
        lineHeight: 18,
        color: "#475569"
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 16,
        marginBottom: 16
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A"
    },

    cardSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
        marginBottom: 12
    },

    verificationItem: {
        minHeight: 70,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        gap: 10
    },

    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },

    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11
    },

    itemText: {
        flex: 1
    },

    itemTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155"
    },

    itemReason: {
        fontSize: 11,
        lineHeight: 16,
        color: "#64748B",
        marginTop: 3
    },

    badge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999
    },

    badgeText: {
        fontSize: 10,
        fontWeight: "800"
    },

    initialState: {
        alignItems: "center",
        paddingVertical: 35
    },

    initialTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#334155",
        marginTop: 10
    },

    initialText: {
        maxWidth: 270,
        textAlign: "center",
        fontSize: 12,
        lineHeight: 18,
        color: "#64748B",
        marginTop: 5
    },

    button: {
        height: 52,
        borderRadius: 14,
        backgroundColor: "#2563EB",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        marginBottom: 16
    },

    buttonDisabled: {
        backgroundColor: "#93C5FD"
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800"
    },

    notice: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#EFF6FF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DBEAFE",
        padding: 14
    },

    noticeText: {
        flex: 1,
        marginLeft: 9,
        fontSize: 11,
        lineHeight: 17,
        color: "#475569"
    }
});