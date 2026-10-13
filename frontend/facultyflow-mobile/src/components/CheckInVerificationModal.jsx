import { useState, useEffect, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAttendance } from "../context/AttendanceContext";
import { useAuth } from "../context/AuthContext";
import {
    buildVerificationSteps,
    executeStepCheck
} from "../services/verification/verificationEngine";
import {
    authenticateBiometric,
    getBiometricCapabilities
} from "../services/verification/biometricService";
import {
    getLocationSignal,
    checkLocationPermission,
    requestLocationPermission,
    getDeviceSignal
} from "../services/device/deviceLocationHelper";
import { verifyNetwork } from "../services/verification/networkService";
import { getActiveCampusNetworks } from "../services/attendance/attendanceApi";

export default function CheckInVerificationModal({ visible, onClose, onComplete }) {
    const { user, accessToken } = useAuth();
    const {
        activePolicy,
        fetchPolicy,
        performCheckIn
    } = useAttendance();

    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [overallSuccess, setOverallSuccess] = useState(false);
    const [policyError, setPolicyError] = useState(null);
    const [isSubmittingServer, setIsSubmittingServer] = useState(false);
    const [serverConfirmation, setServerConfirmation] = useState(null);

    // Accumulated observations
    const collectedSignals = useRef({
        device: null,
        location: null,
        network: null,
        biometricAuth: null
    });

    const stepsRef = useRef([]);
    const policyRef = useRef(activePolicy);

    useEffect(() => {
        stepsRef.current = steps;
    }, [steps]);

    useEffect(() => {
        policyRef.current = activePolicy;
    }, [activePolicy]);

    // Updates a step's state immutably
    const updateStep = useCallback((stepId, updates) => {
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
    }, []);

    // Handles user explicitly granting location permission
    const handleGrantLocation = async (stepIndex) => {
        setIsRunning(true);
        updateStep("location", {
            status: "in_progress",
            resultMessage: "Requesting location permission from Android...",
            diagnostics: "Awaiting permission response",
            actionText: null,
            actionType: null
        });

        const permResult = await requestLocationPermission();

        if (permResult.granted) {
            updateStep("location", {
                status: "in_progress",
                resultMessage: "Acquiring GPS coordinates for campus geofence...",
                diagnostics: "GPS Positioning Active",
                actionText: null,
                actionType: null
            });

            const locResult = await getLocationSignal();
            if (locResult.signal) {
                collectedSignals.current.location = locResult.signal;
                updateStep("location", {
                    status: "passed",
                    resultMessage: "GPS coordinates captured successfully for geofence check.",
                    diagnostics: locResult.diagnostics,
                    actionText: null,
                    actionType: null
                });

                // Clear prerequisite indicators on subsequent steps
                updateStep("biometric", { diagnostics: null });
                updateStep("network", { diagnostics: null });

                // Advance to the next verification step
                runVerificationSequence(stepIndex + 1);
            } else {
                updateStep("location", {
                    status: "failed",
                    resultMessage: locResult.message,
                    diagnostics: locResult.permissionStatus,
                    actionText: "Retry Location",
                    actionType: "retry_location"
                });
                setIsRunning(false);
            }
        } else {
            // Permission denied or permanently blocked
            const canAskAgain = permResult.canAskAgain;
            updateStep("location", {
                status: "waiting_user",
                resultMessage: canAskAgain
                    ? "Location permission was denied. Tap below to grant permission to verify campus presence."
                    : "Location permission is blocked. Please enable 'Allow while using app' in Android Settings.",
                diagnostics: canAskAgain ? "Permission Denied" : "Permission Blocked in Settings",
                actionText: canAskAgain ? "Grant Location Permission" : "Open Android Settings",
                actionType: canAskAgain ? "grant_location" : "open_settings"
            });
            setIsRunning(false);
        }
    };

    // Handles user explicitly triggering biometric authentication
    const handleTriggerBiometric = async (stepIndex) => {
        setIsRunning(true);
        updateStep("biometric", {
            status: "in_progress",
            resultMessage: "Place your finger on the fingerprint sensor to verify identity.",
            actionText: null,
            actionType: null
        });

        const capabilities = await getBiometricCapabilities();
        if (!capabilities.hasHardware || !capabilities.isEnrolled) {
            const failMsg = !capabilities.hasHardware
                ? "Biometric sensor hardware is unavailable on this device."
                : "No fingerprints are enrolled on this phone. Please add a fingerprint in Android Settings.";
            updateStep("biometric", {
                status: "failed",
                resultMessage: failMsg,
                diagnostics: capabilities.biometricName,
                actionText: capabilities.hasHardware ? "Open Security Settings" : null,
                actionType: capabilities.hasHardware ? "open_settings" : null
            });
            setIsRunning(false);
            return;
        }

        const bioAuth = await authenticateBiometric();
        collectedSignals.current.biometricAuth = bioAuth;
        collectedSignals.current.device = await getDeviceSignal(bioAuth);

        if (bioAuth.success) {
            updateStep("biometric", {
                status: "passed",
                resultMessage: bioAuth.reason,
                diagnostics: `${capabilities.biometricName} Verified`,
                actionText: null,
                actionType: null
            });
            // Advance to next step
            runVerificationSequence(stepIndex + 1);
        } else {
            updateStep("biometric", {
                status: bioAuth.code === "CANCELLED" ? "waiting_user" : "failed",
                resultMessage: bioAuth.reason,
                diagnostics: bioAuth.code,
                actionText: "Authenticate Fingerprint",
                actionType: "trigger_biometric"
            });
            setIsRunning(false);
        }
    };

    // Sequentially executes the verification workflow
    const runVerificationSequence = async (startIndex = 0, customSteps = null, customPolicy = null) => {
        setIsRunning(true);
        setServerConfirmation(null);

        const policy = customPolicy || policyRef.current || activePolicy;
        const stepList = customSteps || stepsRef.current;

        if (!stepList || stepList.length === 0) {
            setIsRunning(false);
            return;
        }

        for (let i = startIndex; i < stepList.length; i++) {
            const step = stepList[i];
            setCurrentStepIndex(i);

            // Step 1: Identity
            if (step.id === "identity") {
                updateStep("identity", { status: "in_progress" });
                const idResult = await executeStepCheck("identity", { user });
                if (idResult.passed) {
                    updateStep("identity", {
                        status: "passed",
                        resultMessage: idResult.reason,
                        diagnostics: idResult.diagnostics,
                        actionText: null,
                        actionType: null
                    });
                } else {
                    updateStep("identity", {
                        status: "failed",
                        resultMessage: idResult.reason,
                        diagnostics: idResult.diagnostics,
                        actionText: "Verify Profile",
                        actionType: "open_profile"
                    });
                    setIsRunning(false);
                    return;
                }
            }

            // Step 2: Schedule (only if in policy)
            else if (step.id === "schedule") {
                updateStep("schedule", { status: "in_progress" });
                const schResult = await executeStepCheck("schedule", { policy });
                if (schResult.passed) {
                    updateStep("schedule", {
                        status: "passed",
                        resultMessage: schResult.reason,
                        diagnostics: schResult.diagnostics,
                        actionText: null,
                        actionType: null
                    });
                } else {
                    updateStep("schedule", {
                        status: "failed",
                        resultMessage: schResult.reason,
                        diagnostics: schResult.diagnostics,
                        actionText: null,
                        actionType: null
                    });
                    if (step.isRequired) {
                        setIsRunning(false);
                        return;
                    }
                }
            }

            // Step 3: Location
            else if (step.id === "location") {
                updateStep("location", { status: "in_progress" });
                const permState = await checkLocationPermission();

                if (!permState.granted) {
                    // Need user to grant permission
                    updateStep("location", {
                        status: "waiting_user",
                        resultMessage: "Location permission is required to verify campus geofence boundary.",
                        diagnostics: permState.canAskAgain ? "Location Permission Required" : "Permission Blocked in Android Settings",
                        actionText: permState.canAskAgain ? "Grant Location Permission" : "Open Android Settings",
                        actionType: permState.canAskAgain ? "grant_location" : "open_settings"
                    });

                    // Clarify subsequent steps status
                    updateStep("biometric", {
                        diagnostics: "Prerequisite: Campus location required first."
                    });
                    updateStep("network", {
                        diagnostics: "Prerequisite: Campus location required first."
                    });

                    setIsRunning(false);
                    return; // Pause here for user interaction
                }

                // Permission already granted: capture location
                updateStep("location", {
                    status: "in_progress",
                    resultMessage: "Capturing GPS coordinates for campus geofence...",
                    diagnostics: "GPS Positioning Active"
                });

                const locResult = await getLocationSignal();
                if (locResult.permissionStatus === "granted" && locResult.signal) {
                    collectedSignals.current.location = locResult.signal;
                    updateStep("location", {
                        status: "passed",
                        resultMessage: "GPS coordinates captured successfully for geofence check.",
                        diagnostics: locResult.diagnostics,
                        actionText: null,
                        actionType: null
                    });
                } else {
                    updateStep("location", {
                        status: "failed",
                        resultMessage: locResult.message,
                        diagnostics: locResult.permissionStatus,
                        actionText: "Retry Location",
                        actionType: "retry_location"
                    });
                    setIsRunning(false);
                    return;
                }
            }

            // Step 4: Biometrics / Device
            else if (step.id === "biometric") {
                updateStep("biometric", { status: "in_progress", diagnostics: null });
                const capabilities = await getBiometricCapabilities();

                if (!capabilities.hasHardware || !capabilities.isEnrolled) {
                    const failMsg = !capabilities.hasHardware
                        ? "Biometric sensor hardware is unavailable on this device."
                        : "No fingerprints are enrolled on this phone. Please add a fingerprint in Android Settings.";
                    updateStep("biometric", {
                        status: "failed",
                        resultMessage: failMsg,
                        diagnostics: capabilities.biometricName,
                        actionText: capabilities.hasHardware ? "Open Security Settings" : null,
                        actionType: capabilities.hasHardware ? "open_settings" : null
                    });
                    setIsRunning(false);
                    return;
                }

                // Hardware & enrollment verified: Prompt native Android fingerprint dialog
                updateStep("biometric", {
                    status: "in_progress",
                    resultMessage: "Place your finger on the fingerprint sensor to verify identity.",
                    diagnostics: `${capabilities.biometricName} (Enrolled)`
                });

                const bioAuth = await authenticateBiometric();
                collectedSignals.current.biometricAuth = bioAuth;
                collectedSignals.current.device = await getDeviceSignal(bioAuth);

                if (bioAuth.success) {
                    updateStep("biometric", {
                        status: "passed",
                        resultMessage: bioAuth.reason,
                        diagnostics: `${capabilities.biometricName} Verified`,
                        actionText: null,
                        actionType: null
                    });
                } else {
                    updateStep("biometric", {
                        status: bioAuth.code === "CANCELLED" ? "waiting_user" : "failed",
                        resultMessage: bioAuth.reason,
                        diagnostics: bioAuth.code,
                        actionText: "Authenticate Fingerprint",
                        actionType: "trigger_biometric"
                    });
                    setIsRunning(false);
                    return;
                }
            }

            // Step 5: Network
            else if (step.id === "network") {
                updateStep("network", { status: "in_progress", diagnostics: null });

                let campusNetworks = [];
                try {
                    if (accessToken) {
                        const netRes = await getActiveCampusNetworks(accessToken);
                        if (netRes?.success && Array.isArray(netRes.networks)) {
                            campusNetworks = netRes.networks;
                        }
                    }
                } catch (_netErr) {
                    if (Array.isArray(policy?.campusNetworks)) {
                        campusNetworks = policy.campusNetworks;
                    }
                }

                const netResult = await verifyNetwork(campusNetworks);
                collectedSignals.current.network = netResult.signal;

                if (netResult.passed) {
                    updateStep("network", {
                        status: "passed",
                        resultMessage: netResult.reason,
                        diagnostics: netResult.diagnostics,
                        actionText: null,
                        actionType: null
                    });
                } else {
                    updateStep("network", {
                        status: "failed",
                        resultMessage: netResult.reason,
                        diagnostics: netResult.diagnostics,
                        actionText: "Retry Network Check",
                        actionType: "retry_network"
                    });
                    if (step.isRequired) {
                        setIsRunning(false);
                        return;
                    }
                }
            }
        }

        // =========================================================================
        // ALL CONFIGURED CHECKS PASSED -> AUTHORITATIVE SERVER CONFIRMATION
        // =========================================================================
        setIsSubmittingServer(true);
        setServerConfirmation({
            status: "submitting",
            message: "All policy checks passed locally. Submitting signals for authoritative campus server confirmation..."
        });

        // Ensure device signal is populated
        if (!collectedSignals.current.device) {
            collectedSignals.current.device = await getDeviceSignal(collectedSignals.current.biometricAuth);
        }

        const checkInResult = await performCheckIn({
            device: collectedSignals.current.device,
            location: collectedSignals.current.location,
            network: collectedSignals.current.network
        });

        setIsSubmittingServer(false);

        if (checkInResult.success) {
            setOverallSuccess(true);
            setServerConfirmation({
                status: "passed",
                message: checkInResult.offline
                    ? "Offline check-in saved to device queue. Will sync automatically."
                    : "Attendance confirmed and authoritative record saved on server.",
                diagnostics: checkInResult.offline ? "Offline Queued" : "Authoritative Server Confirmation"
            });
            setIsRunning(false);
            if (onComplete) onComplete(checkInResult);
        } else {
            const blocking = checkInResult.blockingTypes || [];
            const failMsg = checkInResult.error || "Server attendance verification failed.";

            setServerConfirmation({
                status: "failed",
                message: failMsg,
                diagnostics: blocking.length > 0 ? `Failed Signals: ${blocking.join(", ")}` : "Server Rejected"
            });

            // Flag specific sub-steps that the server identified as failed
            if (blocking.includes("LOCATION")) {
                updateStep("location", {
                    status: "failed",
                    resultMessage: "Server Geofence Rejected: Device coordinates are outside the authorized campus perimeter."
                });
            }
            if (blocking.includes("NETWORK")) {
                updateStep("network", {
                    status: "failed",
                    resultMessage: "Server Network Rejected: Connected Wi-Fi / IP does not match campus network policy."
                });
            }
            if (blocking.includes("DEVICE")) {
                updateStep("biometric", {
                    status: "failed",
                    resultMessage: "Server Device Rejected: Biometric authentication token was missing or unverified."
                });
            }

            setIsRunning(false);
        }
    };

    // Handle interactive user button actions
    const handleStepAction = async (step, stepIndex) => {
        if (!step) return;

        if (step.actionType === "open_profile") {
            await Linking.openURL("facultyflowmobile://profile");
            return;
        }

        if (step.actionType === "open_settings") {
            await Linking.openSettings();
            return;
        }

        if (step.actionType === "grant_location" || step.actionType === "retry_location") {
            await handleGrantLocation(stepIndex);
            return;
        }

        if (step.actionType === "trigger_biometric") {
            await handleTriggerBiometric(stepIndex);
            return;
        }

        if (step.actionType === "retry_all") {
            runVerificationSequence(0);
            return;
        }

        // Resume / retry sequence starting directly from the current step
        runVerificationSequence(stepIndex);
    };

    // Initialize steps whenever modal opens
    useEffect(() => {
        if (!visible) return;

        let isMounted = true;

        async function initSteps() {
            setOverallSuccess(false);
            setCurrentStepIndex(0);
            setPolicyError(null);
            setIsSubmittingServer(false);
            setServerConfirmation(null);

            collectedSignals.current = {
                device: null,
                location: null,
                network: null,
                biometricAuth: null
            };

            // Ensure active policy is up to date
            let policy = activePolicy;
            if (!policy) {
                policy = await fetchPolicy();
            }

            if (!isMounted) return;

            if (!policy || !Array.isArray(policy.requiredSignals)) {
                setPolicyError("Unable to retrieve active campus attendance policy. Please check network connection and retry.");
                return;
            }

            const dynamicSteps = buildVerificationSteps(policy);
            if (!dynamicSteps || dynamicSteps.length === 0) {
                setPolicyError("Institutional policy specifies no active verification checks.");
                return;
            }

            setSteps(dynamicSteps);
            // Start automated sequence from Step 0
            runVerificationSequence(0, dynamicSteps, policy);
        }

        initSteps();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, activePolicy, fetchPolicy]);

    // Progress computation
    const totalSteps = steps.length || 1;
    const passedCount = steps.filter(s => s.status === "passed").length;
    const progressPercent = Math.min(100, Math.round((passedCount / totalSteps) * 100));

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    {/* MODAL HEADER */}
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.eyebrowRow}>
                                <Ionicons name="shield-checkmark" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                                <Text style={styles.eyebrow}>CAMPUS VERIFICATION POLICY</Text>
                            </View>
                            <Text style={styles.modalTitle}>Attendance Verification</Text>
                            <Text style={styles.modalSubtitle}>
                                Multi-signal verification required by institutional policy.
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={22} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* POLICY ERROR STATE */}
                    {policyError ? (
                        <View style={styles.policyErrorContainer}>
                            <Ionicons name="alert-circle" size={44} color="#DC2626" style={{ marginBottom: 10 }} />
                            <Text style={styles.policyErrorTitle}>Policy Unavailable</Text>
                            <Text style={styles.policyErrorText}>{policyError}</Text>
                            <TouchableOpacity
                                style={styles.retryPolicyBtn}
                                onPress={async () => {
                                    setPolicyError(null);
                                    const p = await fetchPolicy();
                                    if (p) {
                                        const dyn = buildVerificationSteps(p);
                                        if (dyn) {
                                            setSteps(dyn);
                                            runVerificationSequence(0, dyn, p);
                                        }
                                    } else {
                                        setPolicyError("Failed to fetch policy. Please check connection.");
                                    }
                                }}
                            >
                                <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.retryPolicyBtnText}>Retry Loading Policy</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* PROGRESS BAR */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressLabelRow}>
                                    <Text style={styles.progressLabel}>
                                        {passedCount} of {totalSteps} checks passed
                                    </Text>
                                    <Text style={styles.progressPercent}>{progressPercent}%</Text>
                                </View>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                                </View>
                            </View>

                            {/* STEP LIST */}
                            <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
                                {steps.map((step, idx) => {
                                    const isCurrent = idx === currentStepIndex && isRunning;
                                    return (
                                        <View
                                            key={step.id}
                                            style={[
                                                styles.stepCard,
                                                step.status === "passed" && styles.stepPassed,
                                                step.status === "failed" && styles.stepFailed,
                                                step.status === "waiting_user" && styles.stepWaiting,
                                                isCurrent && styles.stepActive
                                            ]}
                                        >
                                            <View style={styles.stepHeader}>
                                                <View style={styles.iconCircle}>
                                                    <Ionicons
                                                        name={step.icon || "checkmark"}
                                                        size={18}
                                                        color={
                                                            step.status === "passed" ? "#16A34A" :
                                                            step.status === "failed" ? "#DC2626" :
                                                            step.status === "waiting_user" ? "#D97706" :
                                                            "#2563EB"
                                                        }
                                                    />
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <View style={styles.stepTitleRow}>
                                                        <Text style={styles.stepTitle}>{step.title}</Text>
                                                        {step.isRequired ? (
                                                            <View style={styles.requiredBadge}>
                                                                <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                    <Text style={styles.stepDesc}>{step.description}</Text>
                                                </View>
                                                <View style={styles.statusIndicatorBox}>
                                                    {step.status === "in_progress" ? (
                                                        <ActivityIndicator size="small" color="#2563EB" />
                                                    ) : step.status === "passed" ? (
                                                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                                    ) : step.status === "failed" ? (
                                                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                                                    ) : step.status === "waiting_user" ? (
                                                        <Ionicons name="alert-circle" size={20} color="#D97706" />
                                                    ) : (
                                                        <View style={styles.idleDot} />
                                                    )}
                                                </View>
                                            </View>

                                            {/* DIAGNOSTICS & RESULT INFO */}
                                            {step.diagnostics || step.resultMessage ? (
                                                <View style={styles.stepMetaBox}>
                                                    {step.diagnostics ? (
                                                        <Text style={styles.stepDiagnostics}>
                                                            📡 {step.diagnostics}
                                                        </Text>
                                                    ) : null}
                                                    {step.resultMessage ? (
                                                        <Text style={[
                                                            styles.stepResultText,
                                                            step.status === "failed" && styles.stepResultFailed,
                                                            step.status === "passed" && styles.stepResultPassed,
                                                            step.status === "waiting_user" && styles.stepResultWaiting
                                                        ]}>
                                                            {step.resultMessage}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            ) : null}

                                            {/* INTERACTIVE ACTION BUTTON */}
                                            {step.actionText && step.actionType && !isRunning ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.stepActionBtn,
                                                        step.id === "biometric" && styles.stepBioBtn,
                                                        step.actionType === "open_settings" && styles.stepSettingsBtn
                                                    ]}
                                                    onPress={() => handleStepAction(step, idx)}
                                                    activeOpacity={0.8}
                                                >
                                                    {step.id === "biometric" ? (
                                                        <Ionicons name="finger-print" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                                    ) : step.actionType === "open_settings" ? (
                                                        <Ionicons name="settings-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                                    ) : (
                                                        <Ionicons name="arrow-forward-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                                    )}
                                                    <Text style={styles.stepActionBtnText}>{step.actionText}</Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    );
                                })}

                                {/* AUTHORITATIVE SERVER CONFIRMATION CARD */}
                                {isSubmittingServer ? (
                                    <View style={styles.serverSubmittingCard}>
                                        <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.serverSubmittingTitle}>Authoritative Server Confirmation</Text>
                                            <Text style={styles.serverSubmittingText}>Validating institutional signals and recording attendance...</Text>
                                        </View>
                                    </View>
                                ) : null}

                                {serverConfirmation?.status === "failed" ? (
                                    <View style={styles.serverFailedCard}>
                                        <Ionicons name="alert-circle" size={22} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.serverFailedTitle}>Server Verification Rejected</Text>
                                            <Text style={styles.serverFailedText}>{serverConfirmation.message}</Text>
                                            {serverConfirmation.diagnostics ? (
                                                <Text style={styles.serverFailedDiag}>{serverConfirmation.diagnostics}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                ) : null}
                            </ScrollView>

                            {/* OVERALL MODAL FOOTER */}
                            <View style={styles.modalFooter}>
                                {overallSuccess ? (
                                    <View style={styles.successBanner}>
                                        <Ionicons name="checkmark-circle" size={24} color="#16A34A" style={{ marginRight: 8 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.successTitle}>Attendance Recorded!</Text>
                                            <Text style={styles.successDesc}>
                                                {serverConfirmation?.message || "All policy checks confirmed. Your attendance is officially logged."}
                                            </Text>
                                        </View>
                                        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                                            <Text style={styles.doneBtnText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.footerRow}>
                                        <TouchableOpacity
                                            style={styles.cancelFooterBtn}
                                            onPress={onClose}
                                            disabled={isRunning || isSubmittingServer}
                                        >
                                            <Text style={styles.cancelFooterBtnText}>Close</Text>
                                        </TouchableOpacity>

                                        {!isRunning && !isSubmittingServer && !overallSuccess ? (
                                            <TouchableOpacity
                                                style={styles.retryAllBtn}
                                                onPress={() => runVerificationSequence(0)}
                                            >
                                                <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                                <Text style={styles.retryAllBtnText}>Retry All</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        justifyContent: "flex-end"
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "92%",
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12
    },
    eyebrowRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2
    },
    eyebrow: {
        fontSize: 10,
        fontWeight: "800",
        color: "#2563EB",
        letterSpacing: 0.8
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: -0.4
    },
    modalSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 2
    },
    closeBtn: {
        padding: 4
    },
    policyErrorContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 36,
        paddingHorizontal: 16
    },
    policyErrorTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 6
    },
    policyErrorText: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 18
    },
    retryPolicyBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    retryPolicyBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    progressContainer: {
        marginBottom: 14
    },
    progressLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748B"
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: "700",
        color: "#2563EB"
    },
    progressTrack: {
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 4,
        overflow: "hidden"
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#2563EB",
        borderRadius: 4
    },
    stepScroll: {
        maxHeight: 420,
        marginVertical: 4
    },
    stepCard: {
        backgroundColor: "#F8FAFC",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 14,
        marginBottom: 10
    },
    stepActive: {
        borderColor: "#2563EB",
        backgroundColor: "#EFF6FF"
    },
    stepPassed: {
        borderColor: "#BBF7D0",
        backgroundColor: "#F0FDF4"
    },
    stepFailed: {
        borderColor: "#FECACA",
        backgroundColor: "#FEF2F2"
    },
    stepWaiting: {
        borderColor: "#FDE68A",
        backgroundColor: "#FFFBEB"
    },
    stepHeader: {
        flexDirection: "row",
        alignItems: "flex-start"
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    stepTitleRow: {
        flexDirection: "row",
        alignItems: "center"
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
        marginRight: 6
    },
    requiredBadge: {
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    requiredBadgeText: {
        fontSize: 9,
        fontWeight: "800",
        color: "#2563EB"
    },
    stepDesc: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 2,
        lineHeight: 15
    },
    statusIndicatorBox: {
        marginLeft: 8,
        alignItems: "center",
        justifyContent: "center"
    },
    idleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#CBD5E1"
    },
    stepMetaBox: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)"
    },
    stepDiagnostics: {
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        color: "#475569",
        marginBottom: 3
    },
    stepResultText: {
        fontSize: 12,
        color: "#475569",
        lineHeight: 16
    },
    stepResultFailed: {
        color: "#DC2626",
        fontWeight: "600"
    },
    stepResultPassed: {
        color: "#16A34A",
        fontWeight: "600"
    },
    stepResultWaiting: {
        color: "#B45309",
        fontWeight: "500"
    },
    stepActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        borderRadius: 8,
        paddingVertical: 9,
        paddingHorizontal: 14,
        marginTop: 10
    },
    stepBioBtn: {
        backgroundColor: "#1E40AF"
    },
    stepSettingsBtn: {
        backgroundColor: "#475569"
    },
    stepActionBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    serverSubmittingCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EFF6FF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#93C5FD",
        padding: 12,
        marginTop: 4,
        marginBottom: 8
    },
    serverSubmittingTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1E40AF"
    },
    serverSubmittingText: {
        fontSize: 11,
        color: "#3B82F6",
        marginTop: 1
    },
    serverFailedCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FEF2F2",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FECACA",
        padding: 12,
        marginTop: 4,
        marginBottom: 8
    },
    serverFailedTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#991B1B"
    },
    serverFailedText: {
        fontSize: 11,
        color: "#B91C1C",
        marginTop: 1,
        lineHeight: 15
    },
    serverFailedDiag: {
        fontSize: 10,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        color: "#7F1D1D",
        marginTop: 3
    },
    modalFooter: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0"
    },
    footerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end"
    },
    cancelFooterBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 8
    },
    cancelFooterBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B"
    },
    retryAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8
    },
    retryAllBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF"
    },
    successBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 12,
        padding: 12
    },
    successTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#15803D"
    },
    successDesc: {
        fontSize: 11,
        color: "#166534",
        marginTop: 1
    },
    doneBtn: {
        backgroundColor: "#16A34A",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 10
    },
    doneBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF"
    }
});
