"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
function errorHandler(err, _req, res, _next) {
    if (err instanceof apiError_1.ApiError) {
        return (0, apiResponse_1.sendError)(res, err.message, err.statusCode);
    }
    logger_1.logger.error(err.message, { stack: err.stack });
    const message = env_1.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    (0, apiResponse_1.sendError)(res, message, 500);
}
