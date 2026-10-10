import mongoose from "mongoose";


// ============================================================
// AUDIT LOG SCHEMA
// ============================================================

const auditLogSchema = new mongoose.Schema(
    {

        // ----------------------------------------------------
        // UNIQUE AUDIT EVENT ID
        // ----------------------------------------------------

        auditId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },


        // ----------------------------------------------------
        // ACTOR
        // ----------------------------------------------------

        actorId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },


        // ----------------------------------------------------
        // ACTOR ROLE
        // ----------------------------------------------------

        actorRole: {
            type: String,
            required: true,
            enum: [
                "admin",
                "faculty",
                "system"
            ]
        },


        // ----------------------------------------------------
        // ACTION
        // ----------------------------------------------------

        action: {
            type: String,
            required: true,
            trim: true,
            index: true
        },


        // ----------------------------------------------------
        // TARGET TYPE
        // ----------------------------------------------------

        targetType: {
            type: String,
            required: true,
            trim: true
        },


        // ----------------------------------------------------
        // TARGET ID
        // ----------------------------------------------------

        targetId: {
            type: String,
            default: null,
            trim: true,
            index: true
        },


        // ----------------------------------------------------
        // RESULT
        // ----------------------------------------------------

        result: {
            type: String,
            required: true,
            enum: [
                "ATTEMPTED",
                "SUCCESS",
                "FAILED"
            ]
        },


        // ----------------------------------------------------
        // REASON
        // ----------------------------------------------------

        reason: {
            type: String,
            default: null,
            trim: true
        },


        // ----------------------------------------------------
        // METADATA
        // ----------------------------------------------------

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },


        // ----------------------------------------------------
        // SERVER TIMESTAMP
        // ----------------------------------------------------

        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
            index: true
        }

    },

    {
        timestamps: true
    }
);


// ============================================================
// INDEXES
// ============================================================

auditLogSchema.index({
    actorId: 1,
    timestamp: -1
});


auditLogSchema.index({
    action: 1,
    timestamp: -1
});


auditLogSchema.index({
    targetType: 1,
    targetId: 1,
    timestamp: -1
});


// ============================================================
// MODEL
// ============================================================

const AuditLog =
    mongoose.model(
        "AuditLog",
        auditLogSchema
    );


export default AuditLog;