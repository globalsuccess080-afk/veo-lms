"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, message = 'Success', status = 200, meta) {
    res.status(status).json({ success: true, message, data, meta });
}
function sendError(res, message, status = 500) {
    res.status(status).json({ success: false, message, data: null, error: message });
}
