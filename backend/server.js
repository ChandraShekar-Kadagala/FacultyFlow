import app from "./src/app.js";

import env from "./src/config/env.js";

import {
    connectDatabase,
    disconnectDatabase
} from "./src/config/database.js";


let server;


async function startServer() {

    try {

        await connectDatabase();

        server =
            app.listen(
                env.port,
                () => {

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "       FacultyFlow Backend API"
                    );

                    console.log(
                        "========================================"
                    );

                    console.log(
                        `Environment: ${env.nodeEnv}`
                    );

                    console.log(
                        `Server: http://localhost:${env.port}`
                    );

                    console.log(
                        `Health: http://localhost:${env.port}/api/health`
                    );

                    console.log(
                        "========================================"
                    );
                }
            );

    } catch (error) {

        console.error(
            "Failed to start FacultyFlow backend."
        );

        console.error(
            error.message
        );

        process.exit(1);
    }
}


async function shutdown(signal) {

    console.log(
        `${signal} received. Shutting down...`
    );

    if (server) {

        server.close(
            async () => {

                await disconnectDatabase();

                process.exit(0);
            }
        );

    } else {

        await disconnectDatabase();

        process.exit(0);
    }
}


process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);


process.on(
    "unhandledRejection",
    error => {

        console.error(
            "Unhandled Promise Rejection:",
            error
        );

        shutdown(
            "UNHANDLED_REJECTION"
        );
    }
);


process.on(
    "uncaughtException",
    error => {

        console.error(
            "Uncaught Exception:",
            error
        );

        process.exit(1);
    }
);


startServer();