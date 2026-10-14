import mongoose from "mongoose";


// ============================================================
// ATTENDANCE POLICY SCHEMA
// ============================================================

const attendancePolicySchema =
    new mongoose.Schema(

        {

            // ------------------------------------------------
            // POLICY ID
            // ------------------------------------------------

            policyId: {

                type:
                    String,

                required:
                    true,

                unique:
                    true,

                index:
                    true,

                trim:
                    true

            },


            // ------------------------------------------------
            // ATTENDANCE MODE (FLEXIBLE vs SCHEDULED)
            // ------------------------------------------------

            attendanceMode: {

                type:
                    String,

                enum: [
                    "FLEXIBLE",
                    "SCHEDULED"
                ],

                default:
                    "FLEXIBLE",

                trim:
                    true

            },


            // ------------------------------------------------
            // CHECK-IN START (OPTIONAL FOR FLEXIBLE MODE)
            // ------------------------------------------------

            startTime: {

                type:
                    String,

                required:
                    false,

                default:
                    null,

                trim:
                    true

            },


            // ------------------------------------------------
            // CHECK-IN END (OPTIONAL FOR FLEXIBLE MODE)
            // ------------------------------------------------

            endTime: {

                type:
                    String,

                required:
                    false,

                default:
                    null,

                trim:
                    true

            },


            // ------------------------------------------------
            // GRACE PERIOD (OPTIONAL)
            // ------------------------------------------------

            gracePeriod: {

                type:
                    Number,

                required:
                    false,

                min:
                    0,

                default:
                    0

            },


            // ------------------------------------------------
            // LATE THRESHOLD (OPTIONAL)
            // ------------------------------------------------

            lateThreshold: {

                type:
                    Number,

                required:
                    false,

                min:
                    0,

                default:
                    0

            },


            // ------------------------------------------------
            // EARLY EXIT THRESHOLD (OPTIONAL)
            // ------------------------------------------------

            earlyExitThreshold: {

                type:
                    Number,

                required:
                    false,

                min:
                    0,

                default:
                    0

            },


            // ------------------------------------------------
            // MINIMUM WORKING HOURS (OPTIONAL)
            // ------------------------------------------------

            minWorkingHours: {

                type:
                    Number,

                required:
                    false,

                min:
                    0,

                default:
                    0

            },


            // ------------------------------------------------
            // REQUIRED VERIFICATION SIGNALS
            // ------------------------------------------------

            requiredSignals: {

                type: [

                    {

                        type:
                            String,

                        trim:
                            true,

                        uppercase:
                            true

                    }

                ],

                default:
                    []

            },


            // ------------------------------------------------
            // INSTITUTIONAL TIMEZONE
            // ------------------------------------------------

            timezone: {

                type:
                    String,

                default:
                    "Asia/Kolkata",

                trim:
                    true

            },


            // ------------------------------------------------
            // ACTIVE STATE
            // ------------------------------------------------

            active: {

                type:
                    Boolean,

                required:
                    true,

                default:
                    true

            }
        },


        {

            timestamps:
                true

        }

    );


// ============================================================
// INDEXES
// ============================================================

// ------------------------------------------------------------
// Policy history
// ------------------------------------------------------------

attendancePolicySchema.index({

    active:
        1,

    createdAt:
        -1

});


// ------------------------------------------------------------
// SINGLE ACTIVE POLICY GUARANTEE
// ------------------------------------------------------------
//
// MongoDB will allow many inactive policies,
// but only ONE document can have active === true.
//
// This is the database-level safety net.
//
// ------------------------------------------------------------

attendancePolicySchema.index(

    { active: 1 },

    {

        unique:
            true,

        partialFilterExpression: {

            active:
                true

        }

    }

);


// ============================================================
// EXPORT
// ============================================================

export default mongoose.model(

    "AttendancePolicy",

    attendancePolicySchema

);