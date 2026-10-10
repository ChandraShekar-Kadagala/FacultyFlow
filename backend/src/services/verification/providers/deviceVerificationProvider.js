import {
    VERIFICATION_RESULTS
} from "../verificationConstants.js";

import {
    verifyDeviceSignal
} from "../device/deviceVerificationService.js";

import {
    getWebDeviceSignal
} from "../device/deviceClientAdapter.js";


// ============================================================
// DEVICE VERIFICATION PROVIDER
// ============================================================

export async function verifyDevice(
    deviceSignal = null
) {

    // --------------------------------------------------------
    // Current web client
    // --------------------------------------------------------

    if (
        !deviceSignal
    ) {

        const webSignal =
            getWebDeviceSignal();


        return {

            type: "DEVICE",

            result:
                VERIFICATION_RESULTS.UNAVAILABLE,

            reason:
                "Web client does not currently expose a supported biometric/device verification capability.",

            metadata: {

                platform:
                    webSignal.deviceType,

                capability:
                    webSignal.capability

            }

        };

    }


    // --------------------------------------------------------
    // Supported mobile/device signal
    // --------------------------------------------------------

    return verifyDeviceSignal(
        deviceSignal
    );

}