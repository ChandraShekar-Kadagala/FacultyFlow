export const USER_ROLES = {
    ADMIN: "admin",
    FACULTY: "faculty"
};

export const SECURITY_EVENTS = {
    ADMIN_ACCESS_GRANTED:
        "ADMIN_ACCESS_GRANTED",

    ADMIN_ACCESS_DENIED:
        "ADMIN_ACCESS_DENIED",

    ADMIN_ROUTE_BLOCKED:
        "ADMIN_ROUTE_BLOCKED",

    SESSION_EXPIRED:
        "SESSION_EXPIRED",

    LOGOUT:
        "LOGOUT",

    INVALID_ROLE:
        "INVALID_ROLE"
};

export const SECURITY_RESULTS = {
    SUCCESS: "SUCCESS",
    DENIED: "DENIED",
    BLOCKED: "BLOCKED",
    EXPIRED: "EXPIRED"
};

export const SECURITY_STORAGE_KEYS = {
    SECURITY_EVENTS:
        "facultyflow_security_events"
};