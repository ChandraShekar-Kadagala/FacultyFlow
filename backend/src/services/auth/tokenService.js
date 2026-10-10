import jwt from "jsonwebtoken";

import env from "../../config/env.js";


export function generateAccessToken(user) {

    if (!env.jwtSecret) {

        throw new Error(
            "JWT_SECRET is not configured."
        );
    }


    const payload = {

        userId:
            user.userId,

        role:
            user.role
    };


    return jwt.sign(
        payload,
        env.jwtSecret,
        {
            expiresIn:
                env.jwtExpiresIn
        }
    );
}


export function verifyAccessToken(token) {

    if (!env.jwtSecret) {

        throw new Error(
            "JWT_SECRET is not configured."
        );
    }


    return jwt.verify(
        token,
        env.jwtSecret
    );
}