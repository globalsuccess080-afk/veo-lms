"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const apiError_1 = require("../utils/apiError");
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new apiError_1.ApiError(403, 'Forbidden');
        }
        next();
    };
}
