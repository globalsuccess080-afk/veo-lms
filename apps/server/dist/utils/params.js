"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.param = param;
exports.query = query;
function param(value) {
    if (Array.isArray(value))
        return value[0];
    return value || '';
}
function query(value, defaultValue = '') {
    if (Array.isArray(value))
        return value[0] || defaultValue;
    if (typeof value === 'string')
        return value;
    return defaultValue;
}
