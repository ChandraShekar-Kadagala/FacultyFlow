import {
    VERIFICATION_RESULTS
} from "../verificationConstants.js";

import {
    normalizeDeviceId,
    hasValidDeviceSignal
} from "./deviceSecurityUtils.js";


// ============================================================
// VERIFY DEVICE
// ============================================================

export async function verifyDeviceSignal(
    signal
) {

    // --------------------------------------------------------
    // Validate signal
    // --------------------------------------------------------

    if (
        !hasValidDeviceSignal(
            signal
        )
    ) {

        return {

            type: "DEVICE",

            result:
                VERIFICATION_RESULTS.UNAVAILABLE,

            reason:
                "Device verification signal is unavailable.",

            metadata: {

                capability:
                    "NOT_AVAILABLE"

            }

        };

    }


    // --------------------------------------------------------
    // Normalize device information
    // --------------------------------------------------------

    const deviceId =
        normalizeDeviceId(
            signal.deviceId
        );


    // --------------------------------------------------------
    // Capability unavailable
    // --------------------------------------------------------

    if (
        signal.capabilityStatus ===
        "UNAVAILABLE"
    ) {

        return {

            type: "DEVICE",

            result:
                VERIFICATION_RESULTS.UNAVAILABLE,

            reason:
                "Device authentication capability is unavailable.",

            metadata: {

                deviceType:
                    signal.deviceType,

                capability:
                    signal.capability,

                capabilityStatus:
                    signal.capabilityStatus

            }

        };

    }


    // --------------------------------------------------------
    // Biometric capability exists but wasn't verified
    // --------------------------------------------------------

    if (
        signal.biometricAvailable &&
        !signal.biometricVerified
    ) {

        return {

            type: "DEVICE",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Device biometric verification was not successful.",

            metadata: {

                deviceType:
                    signal.deviceType,

                capability:
                    signal.capability,

                deviceIdPresent:
                    Boolean(deviceId)

            }

        };

    }


    // --------------------------------------------------------
    // Successful biometric verification
    // --------------------------------------------------------

    if (
        signal.biometricAvailable &&
        signal.biometricVerified
    ) {

        return {

            type: "DEVICE",

            result:
                VERIFICATION_RESULTS.VERIFIED,

            reason:
                "Device biometric verification succeeded.",

            metadata: {

                deviceType:
                    signal.deviceType,

                capability:
                    signal.capability,

                deviceIdPresent:
                    Boolean(deviceId)

            }

        };

    }


    // --------------------------------------------------------
    // Generic device authentication
    // --------------------------------------------------------

    if (
        signal.capability ===
        "DEVICE_AUTHENTICATION"
    ) {

        if (
            signal.biometricVerified
        ) {

            return {

                type: "DEVICE",

                result:
                    VERIFICATION_RESULTS.VERIFIED,

                reason:
                    "Device authentication succeeded.",

                metadata: {

                    deviceType:
                        signal.deviceType,

                    capability:
                        signal.capability,

                    deviceIdPresent:
                        Boolean(deviceId)

                }

            };

        }


        return {

            type: "DEVICE",

            result:
                VERIFICATION_RESULTS.FAILED,

            reason:
                "Device authentication failed.",

            metadata: {

                deviceType:
                    signal.deviceType,

                capability:
                    signal.capability

            }

        };

    }


    // --------------------------------------------------------
    // No supported capability
    // --------------------------------------------------------

    return {

        type: "DEVICE",

        result:
            VERIFICATION_RESULTS.UNAVAILABLE,

        reason:
            "No supported device verification capability was provided.",

        metadata: {

            deviceType:
                signal.deviceType,

            capability:
                signal.capability

        }

    };

}