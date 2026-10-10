import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
    {
        userId: {
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

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            required: true,
            enum: ["admin", "faculty"],
            default: "faculty"
        },

        facultyId: {
            type: String,
            default: null,
            trim: true
        },

        employeeCode: {
            type: String,
            default: null,
            trim: true
        },

        department: {
            type: String,
            default: null,
            trim: true
        },

        designation: {
            type: String,
            default: null,
            trim: true
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },

        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


const User = mongoose.model(
    "User",
    userSchema
);


export default User;