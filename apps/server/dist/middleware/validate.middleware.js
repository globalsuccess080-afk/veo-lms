"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const apiError_1 = require("../utils/apiError");
/**
 * Recursively sanitizes objects by removing keys that start with '$'
 * to prevent NoSQL injection via MongoDB operators.
 */
function sanitizeNoSql(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sanitizeNoSql);
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            // Drop keys that contain MongoDB operators
            if (key.startsWith('$')) {
                continue;
            }
            sanitized[key] = sanitizeNoSql(obj[key]);
        }
        return sanitized;
    }
    return obj;
}
function validate(schema, source = 'body') {
    return (req, _res, next) => {
        // Sanitize input first
        req[source] = sanitizeNoSql(req[source]);
        // Validate using Zod (which also strips out undeclared fields, preventing parameter pollution)
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            // Map Zod errors into a readable string
            const errorMessage = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new apiError_1.ApiError(400, errorMessage);
        }
        // Assign validated and stripped data back to request
        req[source] = result.data;
        next();
    };
}
