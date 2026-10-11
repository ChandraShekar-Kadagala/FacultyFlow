import {
    verifyAccessToken
} from "../services/auth/tokenService.js";

import User
    from "../models/User.js";

import Faculty
    from "../models/Faculty.js";


export async function authenticateToken(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;


    if (!authHeader) {

        return res.status(401).json({

            success: false,

            message:
                "Authentication token is required."

        });

    }


    const parts =
        authHeader.split(" ");


    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid authorization format."

        });

    }


    const token =
        parts[1];


    try {

        const decoded =
            verifyAccessToken(token);


        const user =
            await User.findOne({
                userId: decoded.userId
            }).select(
                "userId role facultyId status"
            );


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user was not found."

            });

        }


        if (user.status !== "active") {

            return res.status(403).json({

                success: false,

                message:
                    "User account is inactive."

            });

        }


        let facultyId = user.facultyId || null;
        if (!facultyId && user.role === "faculty") {
            const facultyRecord = await Faculty.findOne({ userId: user.userId }).select("facultyId");
            if (facultyRecord) {
                facultyId = facultyRecord.facultyId;
            }
        }

        req.user = {

            userId: user.userId,

            role: user.role,

            facultyId: facultyId

        };


        next();

    } catch (error) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired authentication token."

        });

    }

}