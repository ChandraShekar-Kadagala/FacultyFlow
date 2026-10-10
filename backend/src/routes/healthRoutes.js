import {
    Router
} from "express";

import mongoose from "mongoose";


const router = Router();


router.get(
    "/",
    (req, res) => {

        const databaseConnected =
            mongoose.connection.readyState === 1;

        res.status(
            databaseConnected
                ? 200
                : 503
        ).json({

            success:
                databaseConnected,

            message:
                databaseConnected
                    ? "FacultyFlow API is healthy"
                    : "FacultyFlow API is running but database is not connected",

            environment:
                process.env.NODE_ENV ||
                "development",

            database:
                databaseConnected
                    ? "connected"
                    : "disconnected",

            timestamp:
                new Date().toISOString()
        });
    }
);


export default router;