import bcrypt from "bcrypt";


const SALT_ROUNDS = 12;


export async function hashPassword(password) {

    if (!password) {
        throw new Error(
            "Password is required."
        );
    }

    return bcrypt.hash(
        password,
        SALT_ROUNDS
    );
}


export async function comparePassword(
    password,
    passwordHash
) {

    if (!password || !passwordHash) {
        return false;
    }

    return bcrypt.compare(
        password,
        passwordHash
    );
}