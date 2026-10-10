import { verifyIdentity } from "./identityService";
import { verifyBiometric } from "./biometricService";
import { verifyNetwork } from "./networkService";
import { verifyLocation } from "./locationService";
import { verifySchedule } from "./scheduleService";

export async function runVerification({
    user,
    currentTime
}) {
    const results = [];

    const identity = await verifyIdentity(user);

    results.push(identity);

    const biometric = await verifyBiometric();

    results.push(biometric);

    const network = await verifyNetwork();

    results.push(network);

    const location = await verifyLocation();

    results.push(location);

    const schedule = await verifySchedule({
        currentTime
    });

    results.push(schedule);

    const failedChecks = results.filter(
        result => !result.passed
    );

    const unavailableChecks = results.filter(
        result => !result.available
    );

    const passed =
        failedChecks.length === 0;

    let reason = null;

    if (!passed) {
        reason =
            failedChecks[0]?.reason ||
            "Verification failed.";
    }

    return {
        passed,
        status: passed
            ? "passed"
            : "failed",
        results,
        failedChecks,
        unavailableChecks,
        reason
    };
}