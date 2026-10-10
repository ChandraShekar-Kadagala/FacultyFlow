import mongoose from "mongoose";


const facultySchema = new mongoose.Schema(
    {
        facultyId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        userId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        employeeCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        designation: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "active",
                "inactive"
            ],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);


const Faculty =
    mongoose.model(
        "Faculty",
        facultySchema
    );


export default Faculty;