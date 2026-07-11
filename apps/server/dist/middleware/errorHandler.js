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
    if (err.name === 'MulterError') {
        const message = err.message === 'File too large' ? 'File is too large. Please upload a smaller file.' : err.message;
        return (0, apiResponse_1.sendError)(res, message, 400);
    }
    logger_1.logger.error(err.message, { stack: err.stack });
    const message = env_1.env.NODE_ENV === 'production' ? 'Something went wrong on our side. Please try again in a moment.' : err.message;
    (0, apiResponse_1.sendError)(res, message, 500);
}
