import {
    VERIFICATION_RESULTS,
    VERIFICATION_REASONS
} from "../verificationConstants.js";

import {
    evaluateCheckInPolicy,
    evaluateCheckOutPolicy
} from "../../attendance/policyService.js";


// ============================================================
// SCHEDULE VERIFICATION PROVIDER
// ============================================================

export async function verifySchedule({

    action = "CHECK_IN",

    serverTime = new Date(),

    policy = null

} = {}) {


    // ========================================================
    // POLICY NOT AVAILABLE
    // ========================================================

    if (!policy) {

        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.PENDING,

            reason:
                VERIFICATION_REASONS
                    .SCHEDULE_NOT_AVAILABLE,

            metadata: {

                policyEngine:
                    "POLICY_NOT_AVAILABLE"

            }

        };
    }


    // ========================================================
    // CHECK-IN
    // ========================================================

    if (
        action === "CHECK_IN"
    ) {

        const decision =
            evaluateCheckInPolicy({

                policy,

                serverTime

            });


        // ----------------------------------------------------
        // CHECK-IN NOT ALLOWED
        // ----------------------------------------------------

        if (
            !decision.allowed
        ) {

            return {

                type: "SCHEDULE",

                result:
                    VERIFICATION_RESULTS.FAILED,

                reason:
                    decision.reason,

                metadata: {

                    policyEngine:
                        "INTEGRATED",

                    action,

                    policyState:
                        decision.policyState,

                    attendanceStatus:
                        decision.status

                }

            };
        }


        // ----------------------------------------------------
        // CHECK-IN ALLOWED
        // ----------------------------------------------------

        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.VERIFIED,

            reason:
                VERIFICATION_REASONS
                    .SCHEDULE_VERIFIED,

            metadata: {

                policyEngine:
                    "INTEGRATED",

                action,

                policyState:
                    decision.policyState,

                attendanceStatus:
                    decision.status

            }

        };
    }


    // ========================================================
    // CHECK-OUT
    // ========================================================

    if (
        action === "CHECK_OUT"
    ) {

        const decision =
            evaluateCheckOutPolicy({

                policy,

                serverTime

            });


        return {

            type: "SCHEDULE",

            result:
                VERIFICATION_RESULTS.VERIFIED,

            reason:
                VERIFICATION_REASONS
                    .SCHEDULE_VERIFIED,

            metadata: {

                policyEngine:
                    "INTEGRATED",

                action,

                policyState:
                    decision.policyState,

                earlyExit:
                    decision.earlyExit,

                policyReason:
                    decision.reason

            }

        };
    }


    // ========================================================
    // UNSUPPORTED ACTION
    // ========================================================

    return {

        type: "SCHEDULE",

        result:
            VERIFICATION_RESULTS.FAILED,

        reason:
            "Unsupported attendance action.",

        metadata: {

            policyEngine:
                "INTEGRATED",

            action

        }

    };
}