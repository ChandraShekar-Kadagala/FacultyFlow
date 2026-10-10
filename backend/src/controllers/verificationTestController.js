// ============================================================
// VERIFICATION TEST CONTROLLER
// ============================================================
//
// DEVELOPMENT / TESTING ONLY
//
// This controller runs the Verification Engine without creating
// or modifying an attendance record.
//
// It must never be used as the production attendance endpoint.
// ============================================================

import Faculty from "../models/Faculty.js";

import {
    runVerificationEngine
} from "../services/verification/verificationEngine.js";


// ============================================================
// CONTROLLED VERIFICATION TEST
// ============================================================

export async function testVerificationEngineController(
    req,
    res,
    next
) {

    try {

        // ----------------------------------------------------
        // Production protection
        // ----------------------------------------------------

        if (
            process.env.NODE_ENV ===
            "production"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Verification test endpoint is disabled in production."

            });

        }


        // ----------------------------------------------------
        // Authenticated faculty identity
        // ----------------------------------------------------

        const facultyId =
            req.user?.facultyId;


        if (
            !facultyId
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Authenticated faculty identity is unavailable."

            });

        }


        // ----------------------------------------------------
        // Load faculty from database
        // ----------------------------------------------------

        const faculty =
            await Faculty.findOne({

                facultyId

            });


        if (
            !faculty
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Faculty profile not found."

            });

        }


        // ----------------------------------------------------
        // Read controlled test inputs
        // ----------------------------------------------------

        const {

            action = "CHECK_IN",

            deviceSignal = null,

            networkSignal = null,

            locationSignal = null,

            requiredTypes = undefined,

            testTime = null

        } = req.body || {};


        // ----------------------------------------------------
        // SERVER TIME
        // ----------------------------------------------------
        //
        // In normal mode, the backend creates the timestamp.
        //
        // testTime exists ONLY for controlled development
        // testing so we can test schedule boundaries.
        //
        // It is never accepted by production attendance flow.
        //

        let serverTime =
            new Date();


        let timeMode =
            "SERVER_REAL_TIME";


        if (
            testTime &&
            process.env.NODE_ENV !==
            "production"
        ) {

            const simulatedTime =
                new Date(
                    testTime
                );


            if (
                Number.isNaN(
                    simulatedTime.getTime()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid testTime. Use a valid ISO-8601 timestamp."

                });

            }


            serverTime =
                simulatedTime;


            timeMode =
                "CONTROLLED_TEST_TIME";

        }


        // ----------------------------------------------------
        // RUN VERIFICATION ENGINE
        // ----------------------------------------------------

        const verification =
            await runVerificationEngine({

                user:
                    req.user,

                faculty,

                attendanceId:
                    null,

                action,

                deviceSignal,

                networkSignal,

                locationSignal,

                serverTime,

                requiredTypes

            });


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            testMode: true,

            timeMode,

            verification

        });

    } catch (error) {

        next(error);

    }

}