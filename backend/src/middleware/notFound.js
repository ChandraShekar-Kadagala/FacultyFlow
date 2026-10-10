export function notFound(
    req,
    res
) {

    return res
        .status(404)
        .json({

            success: false,

            code:
                "ROUTE_NOT_FOUND",

            message:
                `Route ${req.method} ${req.originalUrl} was not found.`

        });

}