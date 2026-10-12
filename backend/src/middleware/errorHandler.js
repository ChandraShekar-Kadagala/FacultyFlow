// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

export function errorHandler(
    error,
    req,
    res,
    next
) {

    console.error(
        "API Error:",
        error
    );


    // ========================================================
    // DEFAULT VALUES
    // ========================================================

    let statusCode =
        error.statusCode || 500;


    let message =
        error.message ||
        "An unexpected server error occurred.";


    let code =
        error.code ||
        "INTERNAL_SERVER_ERROR";


    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================

    if (
        error.name ===
        "ValidationError"
    ) {

        statusCode = 400;

        code =
            "VALIDATION_ERROR";

        message =
            "The submitted data is invalid.";

    }


    // ========================================================
    // MONGOOSE CAST ERROR
    // ========================================================

    if (
        error.name ===
        "CastError"
    ) {

        statusCode = 400;

        code =
            "INVALID_IDENTIFIER";

        message =
            "The supplied identifier is invalid.";

    }


    // ========================================================
    // MONGOOSE DUPLICATE KEY
    // ========================================================

    if (
        error.code === 11000
    ) {

        statusCode = 409;

        code =
            "DUPLICATE_RESOURCE";

        message =
            "A record with the same unique value already exists.";

    }


    // ========================================================
    // DEVELOPMENT / PRODUCTION MESSAGE
    // ========================================================

    const response = {

        success: false,

        code,

        message

    };

    if (error.verification) {
        response.verification = error.verification;
    }

    if (error.blockingTypes) {
        response.blockingTypes = error.blockingTypes;
    }


    // ========================================================
    // DEVELOPMENT DEBUG INFORMATION
    // ========================================================

    if (
        process.env.NODE_ENV ===
        "development"
    ) {

        response.debug = {

            path:
                req.originalUrl,

            method:
                req.method

        };

    }


    // ========================================================
    // SEND RESPONSE
    // ========================================================

    return res
        .status(statusCode)
        .json(response);

}