import mongoose from "mongoose";


const syncEventSchema =
    new mongoose.Schema(

        {

            eventId: {

                type: String,

                required: true,

                unique: true,

                index: true,

                trim: true

            },


            eventType: {

                type: String,

                required: true,

                enum: [

                    "CHECK_IN",

                    "CHECK_OUT"

                ],

                trim: true

            },


            facultyId: {

                type: String,

                required: true,

                index: true,

                trim: true

            },


            clientCreatedAt: {

                type: Date,

                default: null

            },


            status: {

                type: String,

                required: true,

                enum: [

                    "RECEIVED",

                    "PROCESSED",

                    "DUPLICATE",

                    "FAILED"

                ],

                default: "RECEIVED",

                index: true

            },


            attendanceId: {

                type: String,

                default: null

            },


            resultCode: {

                type: String,

                default: null

            },


            resultMessage: {

                type: String,

                default: null

            },


            errorCode: {

                type: String,

                default: null

            },


            processedAt: {

                type: Date,

                default: null

            }

        },

        {

            timestamps: true

        }

    );


syncEventSchema.index({

    facultyId: 1,

    createdAt: -1

});


const SyncEvent =
    mongoose.model(

        "SyncEvent",

        syncEventSchema

    );


export default SyncEvent;