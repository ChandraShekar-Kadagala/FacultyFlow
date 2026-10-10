import mongoose from "mongoose";

import env from "./src/config/env.js";

import Faculty from "./src/models/Faculty.js";


const facultyData = [
    {
        facultyId: "F101",
        userId: "U101",
        employeeCode: "EMP-F101",
        name: "Faculty User",
        department: "CSE",
        designation: "Assistant Professor",
        status: "active"
    },

    {
        facultyId: "F102",
        userId: "U102",
        employeeCode: "EMP-F102",
        name: "Faculty Two",
        department: "ECE",
        designation: "Assistant Professor",
        status: "active"
    },

    {
        facultyId: "F103",
        userId: "U103",
        employeeCode: "EMP-F103",
        name: "Faculty Three",
        department: "AIML",
        designation: "Assistant Professor",
        status: "active"
    }
];


async function seedFacultyData() {

    try {

        await mongoose.connect(
            env.mongoUri
        );

        console.log(
            "Connected to MongoDB."
        );


        for (
            const faculty
            of facultyData
        ) {

            const existingFaculty =
                await Faculty.findOne({
                    facultyId:
                        faculty.facultyId
                });


            if (existingFaculty) {

                console.log(
                    `Already exists: ${faculty.facultyId}`
                );

                continue;
            }


            await Faculty.create(
                faculty
            );


            console.log(
                `Created: ${faculty.facultyId}`
            );
        }


        console.log(
            "Faculty seed completed."
        );

    } catch (error) {

        console.error(
            "Faculty seed failed:",
            error.message
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB connection closed."
        );
    }
}


seedFacultyData();