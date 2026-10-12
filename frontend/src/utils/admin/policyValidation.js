export function validatePolicy(policy) {
    const errors = {};

    if (!policy) {
        return {
            isValid: false,
            errors: {
                general: "Policy data is missing."
            }
        };
    }

    if (!policy.checkInStartTime) {
        errors.checkInStartTime = "Check-in start time is required.";
    }

    if (!policy.checkInEndTime) {
        errors.checkInEndTime = "Check-in end time is required.";
    }

    if (
        policy.checkInStartTime &&
        policy.checkInEndTime &&
        policy.checkInStartTime >= policy.checkInEndTime
    ) {
        errors.checkInEndTime = "Check-in end time must be after start time.";
    }

    if (
        policy.gracePeriodMinutes === "" ||
        policy.gracePeriodMinutes === null ||
        policy.gracePeriodMinutes === undefined
    ) {
        errors.gracePeriodMinutes = "Grace period is required.";
    } else if (
        isNaN(Number(policy.gracePeriodMinutes)) ||
        Number(policy.gracePeriodMinutes) < 0 ||
        Number(policy.gracePeriodMinutes) > 120
    ) {
        errors.gracePeriodMinutes = "Grace period must be between 0 and 120 minutes.";
    }

    if (
        policy.lateThreshold !== undefined &&
        policy.lateThreshold !== null &&
        policy.lateThreshold !== ""
    ) {
        const late = Number(policy.lateThreshold);
        if (isNaN(late) || late < 0 || late > 720) {
            errors.lateThreshold = "Late threshold must be between 0 and 720 minutes.";
        }
    }

    if (
        policy.earlyExitThreshold !== undefined &&
        policy.earlyExitThreshold !== null &&
        policy.earlyExitThreshold !== ""
    ) {
        const early = Number(policy.earlyExitThreshold);
        if (isNaN(early) || early < 0 || early > 720) {
            errors.earlyExitThreshold = "Early exit threshold must be between 0 and 720 minutes.";
        }
    }

    // Determine if at least one verification method is enabled
    const hasAtLeastOneVerification = Boolean(
        policy.identityVerification ||
        policy.biometricVerification ||
        policy.networkVerification ||
        policy.locationVerification ||
        policy.scheduleVerification ||
        (Array.isArray(policy.requiredSignals) && policy.requiredSignals.length > 0) ||
        (Array.isArray(policy.requiredVerification) && policy.requiredVerification.length > 0) ||
        (typeof policy.requiredVerification === "boolean" && policy.requiredVerification)
    );

    if (!hasAtLeastOneVerification) {
        errors.requiredVerification = "At least one verification method must be enabled.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}