import mongoose from "mongoose";

import env from "./env.js";


export async function connectDatabase() {

    if (!env.mongoUri) {

        throw new Error(
            "MONGO_URI is not configured."
        );
    }

    try {

        const connection =
            await mongoose.connect(
                env.mongoUri
            );

        console.log(
            "========================================"
        );

        console.log(
            "       MongoDB Connected"
        );

        console.log(
            `Host: ${connection.connection.host}`
        );

        console.log(
            `Database: ${connection.connection.name}`
        );

        console.log(
            "========================================"
        );

        return connection;

    } catch (error) {

        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );

        throw error;
    }
}


export async function disconnectDatabase() {

    if (
        mongoose.connection.readyState === 0
    ) {
        return;
    }

    await mongoose.disconnect();

    console.log(
        "MongoDB connection closed."
    );
}