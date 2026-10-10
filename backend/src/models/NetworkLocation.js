import mongoose from "mongoose";


// ============================================================
// NETWORK LOCATION SCHEMA
// ============================================================

const networkLocationSchema = new mongoose.Schema(
    {

        // ----------------------------------------------------
        // NETWORK LOCATION ID
        // ----------------------------------------------------

        networkLocationId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },


        // ----------------------------------------------------
        // DISPLAY NAME
        // ----------------------------------------------------

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ----------------------------------------------------
        // BUILDING
        // ----------------------------------------------------

        building: {
            type: String,
            default: null,
            trim: true
        },


        // ----------------------------------------------------
        // FLOOR / AREA
        // ----------------------------------------------------

        floorArea: {
            type: String,
            default: null,
            trim: true
        },


        // ----------------------------------------------------
        // EXPECTED SSID
        // ----------------------------------------------------

        expectedSSID: {
            type: String,
            default: null,
            trim: true
        },


        // ----------------------------------------------------
        // EXPECTED BSSIDs
        // ----------------------------------------------------

        expectedBSSIDs: {
            type: [String],
            default: []
        },


        // ----------------------------------------------------
        // ALLOWED IP RANGES
        // ----------------------------------------------------

        allowedIPRanges: {
            type: [String],
            default: []
        },


        // ----------------------------------------------------
        // VERIFICATION MODE
        // ----------------------------------------------------

        verificationMode: {
            type: String,

            enum: [
                "SSID",
                "BSSID",
                "IP_RANGE",
                "BSSID_OR_IP",
                "BSSID_AND_IP"
            ],

            default: "BSSID_OR_IP"
        },


        // ----------------------------------------------------
        // ACTIVE
        // ----------------------------------------------------

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


// ============================================================
// INDEXES
// ============================================================

networkLocationSchema.index({
    active: 1,
    building: 1
});


// ============================================================
// MODEL
// ============================================================

const NetworkLocation =
    mongoose.model(
        "NetworkLocation",
        networkLocationSchema
    );


export default NetworkLocation;