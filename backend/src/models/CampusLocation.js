import mongoose from "mongoose";

const campusLocationSchema =
    new mongoose.Schema(

        {

            locationId: {

                type: String,

                required: true,

                unique: true,

                index: true,

                trim: true

            },


            name: {

                type: String,

                required: true,

                trim: true,

                minlength: 2,

                maxlength: 100

            },


            latitude: {

                type: Number,

                required: true,

                min: -90,

                max: 90

            },


            longitude: {

                type: Number,

                required: true,

                min: -180,

                max: 180

            },


            radiusMeters: {

                type: Number,

                required: true,

                min: 10,

                max: 10000

            },


            active: {

                type: Boolean,

                default: true,

                index: true

            }

        },

        {

            timestamps: true

        }

    );


campusLocationSchema.index({

    active: 1,

    createdAt: -1

});


const CampusLocation =
    mongoose.model(

        "CampusLocation",

        campusLocationSchema

    );


export default CampusLocation;