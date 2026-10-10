export function sanitizeText(
    value,
    maxLength = 200
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .slice(0, maxLength);
}


export function sanitizeId(value) {
    return sanitizeText(
        value,
        100
    );
}


export function sanitizeReason(value) {
    return sanitizeText(
        value,
        500
    );
}