import dotenv from "dotenv";


dotenv.config();


const env = {

    nodeEnv:
        process.env.NODE_ENV ||
        "development",

    port:
        Number(process.env.PORT) ||
        5000,

    frontendUrl:
        process.env.FRONTEND_URL ||
        "http://localhost:5173",

    mongoUri:
        process.env.MONGO_URI ||
        "",

    jwtSecret:
        process.env.JWT_SECRET ||
        "",

    jwtExpiresIn:
        process.env.JWT_EXPIRES_IN ||
        "1d",

    institutionalTimezone:
        process.env.INSTITUTIONAL_TIMEZONE ||
        "Asia/Kolkata"
};


export default env;