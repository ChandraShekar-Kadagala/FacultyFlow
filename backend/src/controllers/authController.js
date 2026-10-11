import mongoose from "mongoose";
import User from "../models/User.js";

import {
    comparePassword
} from "../services/auth/passwordService.js";

import {
    generateAccessToken
} from "../services/auth/tokenService.js";

export async function login(
    req,
    res,
    next
) {

    try {

        // Check database connection readiness
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                code: "DATABASE_UNAVAILABLE",
                message: "Database service is temporarily unavailable. Please try again shortly."
            });
        }

        const {
            email,
            password
        } = req.body;


        // Validate input

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."
            });
        }


        // Normalize email

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();


        // Find user and explicitly include
        // passwordHash

        const user =
            await User
                .findOne({
                    email: normalizedEmail
                })
                .select("+passwordHash");


        // Do not reveal whether
        // email exists

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."
            });
        }


        // Check account status

        if (
            user.status !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is inactive."
            });
        }


        // Compare password

        const passwordValid =
            await comparePassword(
                password,
                user.passwordHash
            );


        if (!passwordValid) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."
            });
        }


        // Update last login

        user.lastLoginAt =
            new Date();

        await user.save();
        const accessToken =
    generateAccessToken(user);


        // Return safe user data

return res.status(200).json({

    success: true,

    message:
        "Login successful.",

    accessToken,

    user: {

        userId:
            user.userId,

        name:
            user.name,

        email:
            user.email,

        role:
            user.role,

        facultyId:
            user.facultyId,

        employeeCode:
            user.employeeCode,

        department:
            user.department,

        designation:
            user.designation,

        status:
            user.status
    }
});
    } catch (error) {

        next(error);
    }
}