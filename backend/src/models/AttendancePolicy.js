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
            // CHECK-IN START
            // ------------------------------------------------

            startTime: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                match: [

                    /^([01]\d|2[0-3]):([0-5]\d)$/,

                    "startTime must use HH:mm format."

                ]

            },


            // ------------------------------------------------
            // CHECK-IN END
            // ------------------------------------------------

            endTime: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                match: [

                    /^([01]\d|2[0-3]):([0-5]\d)$/,

                    "endTime must use HH:mm format."

                ]

            },


            // ------------------------------------------------
            // GRACE PERIOD
            // ------------------------------------------------

            gracePeriod: {

                type:
                    Number,

                required:
                    true,

                min:
                    0,

                default:
                    0

            },


            // ------------------------------------------------
            // LATE THRESHOLD
            // ------------------------------------------------

            lateThreshold: {

                type:
                    Number,

                required:
                    true,

                min:
                    0,

                default:
                    0

            },


            // ------------------------------------------------
            // EARLY EXIT THRESHOLD
            // ------------------------------------------------

            earlyExitThreshold: {

                type:
                    Number,

                required:
                    true,

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
            // ACTIVE STATE
            // ------------------------------------------------

            active: {

                type:
                    Boolean,

                required:
                    true,

                default:
                    true,

                index:
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