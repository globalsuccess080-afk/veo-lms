"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const generateToken_1 = require("../utils/generateToken");
const apiError_1 = require("../utils/apiError");
function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw new apiError_1.ApiError(401, 'Authentication required');
    }
    const token = header.split(' ')[1];
    try {
        req.user = (0, generateToken_1.verifyAccessToken)(token);
    }
    catch {
        throw new apiError_1.ApiError(401, 'Session expired');
    }
    next();
}
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            req.user = (0, generateToken_1.verifyAccessToken)(header.split(' ')[1]);
        }
        catch { }
    }
    next();
}
