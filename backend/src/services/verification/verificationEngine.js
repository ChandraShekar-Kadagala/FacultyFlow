import VerificationEvent
    from "../../models/VerificationEvent.js";

import {
    VERIFICATION_RESULTS,
    VERIFICATION_STATUS
} from "./verificationConstants.js";

import {
    verifyIdentity
} from "./providers/identityVerificationProvider.js";

import {
    verifyDevice
} from "./providers/deviceVerificationProvider.js";

import {
    verifyNetwork
} from "./providers/networkVerificationProvider.js";

import {
    verifyLocation
} from "./providers/locationVerificationProvider.js";

import {
    verifySchedule
} from "./providers/scheduleVerificationProvider.js";

import {
    aggregateVerificationResults
} from "./verificationDecisionService.js";


// ============================================================
// VERIFICATION ENGINE
// ============================================================

export async function runVerificationEngine({

    user,

    faculty,

    attendanceId = null,

    action = "CHECK_IN",

    deviceSignal = null,

    networkSignal = null,

    locationSignal = null,

    serverTime = new Date(),

    requiredTypes = null,

    policy = null

} = {}) {


    // ========================================================
    // VALIDATE USER
    // ========================================================

    if (!user) {

        throw new Error(
            "Authenticated user is required for verification."
        );
    }


    // ========================================================
    // VALIDATE FACULTY
    // ========================================================

    if (!faculty) {

        throw new Error(
            "Faculty profile is required for verification."
        );
    }


    // ========================================================
    // VERIFICATION SESSION
    // ========================================================

    const verificationSessionId =
        generateVerificationSessionId();


    // ========================================================
    // IDENTITY
    // ========================================================

    const identityResult =
        await verifyIdentity({

            user,

            faculty

        });


    // ========================================================
    // DEVICE
    // ========================================================

    const deviceResult =
        await verifyDevice(
            deviceSignal
        );


    // ========================================================
    // NETWORK
    // ========================================================

    const networkResult =
        await verifyNetwork({
            networkSignal
        });


    // ========================================================
    // LOCATION
    // ========================================================

    const locationResult =
        await verifyLocation({
            locationSignal
        });


    // ========================================================
    // SCHEDULE
    // ========================================================

    const scheduleResult =
        await verifySchedule({

            action,

            serverTime,

            policy

        });


    // ========================================================
    // COLLECT RESULTS
    // ========================================================

    const results = [

        identityResult,

        deviceResult,

        networkResult,

        locationResult,

        scheduleResult

    ];


    // ========================================================
    // FINAL REQUIRED TYPES
    // ========================================================

    const finalRequiredTypes =
        Array.isArray(
            requiredTypes
        )
            ? requiredTypes
            : undefined;


    // ========================================================
    // AGGREGATE DECISION
    // ========================================================

    const decision =
        aggregateVerificationResults({

            results,

            requiredTypes:
                finalRequiredTypes

        });


    // ========================================================
    // PERSIST VERIFICATION EVENTS
    // ========================================================

    const persistedEvents = [];

    for (
        const result of results
    ) {

        const verificationEvent =
            await VerificationEvent.create({

                verificationEventId:
                    generateVerificationEventId(),

                verificationSessionId,

                facultyId:
                    faculty.facultyId,

                actorId:
                    user.userId,

                attendanceId,

                type:
                    result.type,

                result:
                    result.result,

                reason:
                    result.reason,

                metadata:
                    sanitizeMetadata(
                        result.metadata
                    ),

                timestamp:
                    serverTime

            });


        persistedEvents.push(
            verificationEvent
        );
    }


    // ========================================================
    // RETURN FINAL RESULT
    // ========================================================

    return {

        verificationSessionId,

        status:
            decision.status,

        result:
            mapStatusToResult(
                decision.status
            ),

        reason:
            decision.reason,

        action,

        serverTime,

        requiredTypes:
            decision.requiredTypes,

        blockingTypes:
            decision.blockingTypes,

        checks: {

            identity:
                identityResult,

            device:
                deviceResult,

            network:
                networkResult,

            location:
                locationResult,

            schedule:
                scheduleResult

        },

        verificationEvents:
            persistedEvents.map(
                event => ({

                    verificationEventId:
                        event.verificationEventId,

                    verificationSessionId:
                        event.verificationSessionId,

                    type:
                        event.type,

                    result:
                        event.result,

                    timestamp:
                        event.timestamp

                })
            )

    };
}


// ============================================================
// GENERATE VERIFICATION SESSION ID
// ============================================================

function generateVerificationSessionId() {

    return (
        `VSESSION-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`
    );
}


// ============================================================
// GENERATE VERIFICATION EVENT ID
// ============================================================

function generateVerificationEventId() {

    return (
        `VER-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`
    );
}


// ============================================================
// MAP STATUS → RESULT
// ============================================================

function mapStatusToResult(
    status
) {

    if (
        status ===
        VERIFICATION_STATUS.VERIFIED
    ) {

        return VERIFICATION_RESULTS.VERIFIED;
    }

    if (
        status ===
        VERIFICATION_STATUS.FAILED
    ) {

        return VERIFICATION_RESULTS.FAILED;
    }

    return VERIFICATION_RESULTS.PENDING;
}


// ============================================================
// REMOVE RAW BIOMETRIC DATA
// ============================================================

function sanitizeMetadata(
    metadata
) {

    if (
        !metadata ||
        typeof metadata !== "object"
    ) {

        return {};
    }

    const sanitized = {
        ...metadata
    };


    delete sanitized.fingerprint;

    delete sanitized.faceImage;

    delete sanitized.faceEmbedding;

    delete sanitized.biometricTemplate;

    delete sanitized.rawBiometricData;


    return sanitized;
}