import mongoose
    from "mongoose";


// ============================================================
// VERIFICATION EVENT SCHEMA
// ============================================================

const verificationEventSchema =
    new mongoose.Schema({

        verificationEventId: {

            type: String,

            required: true,

            unique: true,

            index: true

        },


        verificationSessionId: {

            type: String,

            required: true,

            index: true

        },


        facultyId: {

            type: String,

            required: true,

            index: true

        },


        actorId: {

            type: String,

            required: true

        },


        attendanceId: {

            type: String,

            default: null,

            index: true

        },


        type: {

            type: String,

            enum: [

                "IDENTITY",

                "DEVICE",

                "NETWORK",

                "LOCATION",

                "SCHEDULE"

            ],

            required: true

        },


        result: {

            type: String,

            enum: [

                "VERIFIED",

                "PENDING",

                "FAILED",

                "UNAVAILABLE"

            ],

            required: true

        },


        reason: {

            type: String,

            default: null

        },


        metadata: {

            type: mongoose.Schema.Types.Mixed,

            default: {}

        },


        timestamp: {

            type: Date,

            required: true,

            default: Date.now,

            index: true

        }

    }, {

        timestamps: true

    });


// ============================================================
// INDEXES
// ============================================================

verificationEventSchema.index({

    facultyId: 1,

    timestamp: -1

});


verificationEventSchema.index({

    attendanceId: 1,

    timestamp: -1

});


verificationEventSchema.index({

    verificationSessionId: 1,

    timestamp: -1

});


verificationEventSchema.index({

    type: 1,

    result: 1,

    timestamp: -1

});


// ============================================================
// MODEL
// ============================================================

const VerificationEvent =
    mongoose.model(
        "VerificationEvent",
        verificationEventSchema
    );


export default VerificationEvent;