import { verifyIdentity } from "./identityService";
import { verifyBiometric } from "./biometricService";
import { verifyNetwork } from "./networkService";
import { verifyLocation } from "./locationService";
import { verifySchedule } from "./scheduleService";

/**
 * Dynamically builds ordered verification steps based strictly on the active policy.
 * If policy retrieval fails or policy is null, returns null so the UI displays
 * an explicit policy error instead of silently falling back to a hardcoded list.
 */
export function buildVerificationSteps(policy = null) {
    if (!policy || !Array.isArray(policy.requiredSignals)) {
        return null;
    }

    const rawSignals = policy.requiredSignals.map(s => String(s).toUpperCase());
    const steps = [];

    // 1. Identity & Session
    if (rawSignals.includes("IDENTITY")) {
        steps.push({
            id: "identity",
            type: "IDENTITY",
            title: "Faculty Identity & Session",
            description: "Verifies authenticated faculty credentials and institutional role.",
            icon: "person-circle-outline",
            isRequired: true,
            status: "not_started",
            resultMessage: null,
            diagnostics: null
        });
    }

    // 2. Institutional Schedule window (Only if configured by admin)
    if (rawSignals.includes("SCHEDULE")) {
        steps.push({
            id: "schedule",
            type: "SCHEDULE",
            title: "Institutional Schedule Window",
            description: `Validates attendance is recorded within official hours (${policy.startTime || "00:00"} – ${policy.endTime || "23:59"}).`,
            icon: "time-outline",
            isRequired: true,
            status: "not_started",
            resultMessage: null,
            diagnostics: null
        });
    }

    // 3. Location & Geofence (Only if configured by admin)
    if (rawSignals.includes("LOCATION")) {
        steps.push({
            id: "location",
            type: "LOCATION",
            title: "Campus Geofence Location",
            description: "Captures device GPS coordinates to evaluate campus perimeter presence.",
            icon: "location-outline",
            isRequired: true,
            status: "not_started",
            resultMessage: null,
            diagnostics: null
        });
    }

    // 4. Device & Native Biometrics (Only if configured by admin)
    if (rawSignals.includes("DEVICE")) {
        steps.push({
            id: "biometric",
            type: "DEVICE",
            title: "Device Biometric Authentication",
            description: "Confirms device possession and faculty member identity via native biometric sensor.",
            icon: "finger-print-outline",
            isRequired: true,
            status: "not_started",
            resultMessage: null,
            diagnostics: null
        });
    }

    // 5. University Network / Wi-Fi (Only if configured by admin)
    if (rawSignals.includes("NETWORK")) {
        steps.push({
            id: "network",
            type: "NETWORK",
            title: "Campus Network / Wi-Fi",
            description: "Observes network connection against authorized campus Wi-Fi or institutional IP range.",
            icon: "wifi-outline",
            isRequired: true,
            status: "not_started",
            resultMessage: null,
            diagnostics: null
        });
    }

    return steps;
}

/**
 * Runs individual verification check by step ID.
 */
export async function executeStepCheck(stepId, { user, policy, currentTime = new Date(), biometricPrompt = false } = {}) {
    switch (stepId) {
        case "identity":
            return verifyIdentity(user);
        case "schedule":
            return verifySchedule({ currentTime, policy });
        case "location":
            return verifyLocation();
        case "biometric":
            return verifyBiometric({ promptMessage: "FacultyFlow Attendance Verification" });
        case "network":
            return verifyNetwork();
        default:
            return {
                passed: false,
                status: "failed",
                reason: `Unknown verification step: ${stepId}`
            };
    }
}