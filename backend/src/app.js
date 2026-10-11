import express from "express";
import cors from "cors";

import env from "./config/env.js";

import healthRoutes
    from "./routes/healthRoutes.js";

import {
    notFound
} from "./middleware/notFound.js";

import {
    errorHandler
} from "./middleware/errorHandler.js";
    import authRoutes from "./routes/authRoutes.js";
import facultyRoutes
    from "./routes/facultyRoutes.js";
import dashboardRoutes
    from "./routes/dashboardRoutes.js";
import attendanceRoutes
    from "./routes/attendanceRoutes.js";
    import adminAttendanceRoutes
    from "./routes/adminAttendanceRoutes.js";
import verificationTestRoutes
    from "./routes/verificationTestRoutes.js";
const app = express();
import policyRoutes
    from "./routes/policyRoutes.js";
import locationRoutes
    from "./routes/locationRoutes.js";
    import syncRoutes
    from "./routes/syncRoutes.js";
import { timingMiddleware } from "./middleware/timingMiddleware.js";

/* ========================================
   CORS
======================================== */

const allowedOrigins = [
    env.frontendUrl,
    "https://faculty-flow-nine.vercel.app",
    "http://localhost:5173",
    "http://localhost:8081",
    "http://localhost:3000"
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (native mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);

            const isAllowed = allowedOrigins.some(allowed => {
                if (allowed.includes(",")) {
                    return allowed.split(",").map(s => s.trim()).includes(origin);
                }
                return allowed === origin;
            });

            if (isAllowed || env.nodeEnv === "development") {
                return callback(null, true);
            }

            return callback(null, false);
        },
        credentials: true
    })
);

app.use(timingMiddleware);


/* ========================================
   BODY PARSERS
======================================== */

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


/* ========================================
   API ROOT
======================================== */

app.get("/api", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "Welcome to FacultyFlow API",

        version: "1.0.0"
    });
});


app.use(
    "/api/health",
    healthRoutes
);



app.use(
    "/api/auth",
    authRoutes
);
app.use(
    "/api/faculty",
    facultyRoutes
);
app.use(
    "/api/admin/dashboard",
    dashboardRoutes
);
app.use(
    "/api/attendance",
    attendanceRoutes
);
app.use(
    "/api/admin/attendance",
    adminAttendanceRoutes
);

app.use(
    "/api/dev/verification",
    verificationTestRoutes
);
app.use(
    "/api/admin/policy",
    policyRoutes
);
app.use(
    "/api/admin/locations",
    locationRoutes
);
app.use(
    "/api/sync",
    syncRoutes
);
app.use(notFound);

app.use(errorHandler)


export default app;