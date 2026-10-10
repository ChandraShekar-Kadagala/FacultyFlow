export function validatePolicy(policy) {
    const errors = {};

    if (!policy.checkInStartTime) {
        errors.checkInStartTime =
            "Check-in start time is required.";
    }

    if (!policy.checkInEndTime) {
        errors.checkInEndTime =
            "Check-in end time is required.";
    }

    if (
        policy.checkInStartTime &&
        policy.checkInEndTime &&
        policy.checkInStartTime >=
            policy.checkInEndTime
    ) {
        errors.checkInEndTime =
            "Check-in end time must be after start time.";
    }

    if (
        policy.gracePeriodMinutes === "" ||
        policy.gracePeriodMinutes === null ||
        policy.gracePeriodMinutes === undefined
    ) {
        errors.gracePeriodMinutes =
            "Grace period is required.";
    } else if (
        Number(policy.gracePeriodMinutes) < 0 ||
        Number(policy.gracePeriodMinutes) > 120
    ) {
        errors.gracePeriodMinutes =
            "Grace period must be between 0 and 120 minutes.";
    }

    if (
        !policy.requiredVerification
    ) {
        errors.requiredVerification =
            "At least one verification method must be enabled.";
    }

    return {
        isValid:
            Object.keys(errors).length === 0,
        errors
    };
}