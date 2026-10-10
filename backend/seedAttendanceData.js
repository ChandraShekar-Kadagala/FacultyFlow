// DEVELOPMENT / TEST DATA ONLY.
// These attendance records are not real university attendance data.
import mongoose from "mongoose";


import env
    from "./src/config/env.js";

import Faculty
    from "./src/models/Faculty.js";

import AttendanceRecord
    from "./src/models/AttendanceRecord.js";


// ============================================================
// TEST ATTENDANCE DATA
// ============================================================

const attendanceData = [

    {
        attendanceId:
            "ATT-F101-2026-09-24",

        facultyId:
            "F101",

        date:
            "2026-09-24",

        checkInTime:
            new Date("2026-09-24T09:18:00"),

        checkOutTime:
            new Date("2026-09-24T17:08:00"),

        status:
            "Present",

        verificationStatus:
            "Verified",

        verificationEventId:
            null,

        syncStatus:
            "SYNCED",

        source:
            "WEB"
    },


    {
        attendanceId:
            "ATT-F102-2026-09-24",

        facultyId:
            "F102",

        date:
            "2026-09-24",

        checkInTime:
            new Date("2026-09-24T09:47:00"),

        checkOutTime:
            new Date("2026-09-24T17:05:00"),

        status:
            "Late",

        verificationStatus:
            "Verified",

        verificationEventId:
            null,

        syncStatus:
            "SYNCED",

        source:
            "WEB"
    },


    {
        attendanceId:
            "ATT-F103-2026-09-24",

        facultyId:
            "F103",

        date:
            "2026-09-24",

        checkInTime:
            new Date("2026-09-24T09:21:00"),

        checkOutTime:
            new Date("2026-09-24T16:58:00"),

        status:
            "Present",

        verificationStatus:
            "Pending",

        verificationEventId:
            null,

        syncStatus:
            "SYNCED",

        source:
            "WEB"
    },


    {
        attendanceId:
            "ATT-F101-2026-09-25",

        facultyId:
            "F101",

        date:
            "2026-09-25",

        checkInTime:
            new Date("2026-09-25T09:25:00"),

        checkOutTime:
            new Date("2026-09-25T17:10:00"),

        status:
            "Present",

        verificationStatus:
            "Verified",

        verificationEventId:
            null,

        syncStatus:
            "SYNCED",

        source:
            "WEB"
    },


    {
        attendanceId:
            "ATT-F102-2026-09-25",

        facultyId:
            "F102",

        date:
            "2026-09-25",

        checkInTime:
            new Date("2026-09-25T09:55:00"),

        checkOutTime:
            new Date("2026-09-25T17:03:00"),

        status:
            "Late",

        verificationStatus:
            "Verified",

        verificationEventId:
            null,

        syncStatus:
            "SYNCED",

        source:
            "WEB"
    },


    {
        attendanceId:
            "ATT-F103-2026-09-25",

        facultyId:
            "F103",

        date:
            "2026-09-25",

        checkInTime:
            new Date("2026-09-25T09:31:00"),

        checkOutTime:
            null,

        status:
            "Incomplete",

        verificationStatus:
            "Pending",

        verificationEventId:
            null,

        syncStatus:
            "SYNCED",

        source:
            "WEB"
    }

];


// ============================================================
// SEED FUNCTION
// ============================================================

async function seedAttendanceData() {

    try {

        // ----------------------------------------------------
        // Connect MongoDB
        // ----------------------------------------------------

        await mongoose.connect(
            env.mongoUri
        );

        console.log(
            "MongoDB connected."
        );


        // ----------------------------------------------------
        // Process each attendance record
        // ----------------------------------------------------

        for (
            const attendance of attendanceData
        ) {

            // -----------------------------------------------
            // Verify faculty exists
            // -----------------------------------------------

            const faculty =
                await Faculty.findOne({
                    facultyId:
                        attendance.facultyId
                });


            if (!faculty) {

                console.log(
                    `Faculty not found: ${attendance.facultyId}`
                );

                continue;

            }


            // -----------------------------------------------
            // Check existing attendance
            // -----------------------------------------------

            const existingRecord =
                await AttendanceRecord.findOne({
                    facultyId:
                        attendance.facultyId,

                    date:
                        attendance.date
                });


            if (existingRecord) {

                console.log(
                    `Already exists: ${attendance.attendanceId}`
                );

                continue;

            }


            // -----------------------------------------------
            // Create attendance
            // -----------------------------------------------

            await AttendanceRecord.create(
                attendance
            );


            console.log(
                `Created: ${attendance.attendanceId}`
            );

        }


        console.log(
            "Attendance seed completed."
        );


    } catch (error) {

        console.error(
            "Attendance seed failed:"
        );

        console.error(
            error.message
        );


    } finally {

        // ----------------------------------------------------
        // Close connection
        // ----------------------------------------------------

        await mongoose.disconnect();

        console.log(
            "MongoDB connection closed."
        );

    }

}


seedAttendanceData();