import mongoose
    from "mongoose";


// ============================================================
// ATTENDANCE RECORD SCHEMA
// ============================================================

const attendanceRecordSchema =
    new mongoose.Schema({

        attendanceId: {

            type: String,

            required: true,

            unique: true,

            index: true

        },


        facultyId: {

            type: String,

            required: true,

            index: true

        },


        date: {

            type: String,

            required: true,

            index: true

        },


        checkInTime: {

            type: Date,

            default: null

        },


        checkOutTime: {

            type: Date,

            default: null

        },


        status: {

            type: String,

            enum: [

                "Present",

                "Late",

                "Absent",

                "Incomplete"

            ],

            default: "Present"

        },


        verificationStatus: {

            type: String,

            enum: [

                "Verified",

                "Pending",

                "Failed"

            ],

            default: "Pending"

        },


        verificationEventId: {

            type: String,

            default: null

        },


        verificationSessionId: {

            type: String,

            default: null,

            index: true

        },


        syncStatus: {

            type: String,

            enum: [

                "SYNCED",

                "PENDING_SYNC",

                "SYNC_FAILED"

            ],

            default: "SYNCED"

        },


        source: {
            type: String,
            enum: [
                "WEB",
                "MOBILE",
                "SYNC"
            ],
            default: "WEB"
        },
        syncEventId: {
            type: String,
            default: null,
            index: true
        }

    }, {

        timestamps: true

    });


// ============================================================
// ONE ATTENDANCE RECORD PER FACULTY PER DATE
// ============================================================

attendanceRecordSchema.index({

    facultyId: 1,

    date: 1

}, {

    unique: true

});


// ============================================================
// MODEL
// ============================================================

const AttendanceRecord =
    mongoose.model(
        "AttendanceRecord",
        attendanceRecordSchema
    );


export default AttendanceRecord;