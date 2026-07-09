"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedFrontendOrigins = exports.primaryFrontendOrigin = void 0;
exports.normalizeOrigin = normalizeOrigin;
exports.isAllowedFrontendOrigin = isAllowedFrontendOrigin;
const env_1 = require("./env");
const frontendUrl = new URL(env_1.env.FRONTEND_URL);
function toOrigin(url) {
    return `${url.protocol}//${url.host}`;
}
function withHostname(hostname) {
    const clone = new URL(frontendUrl.toString());
    clone.hostname = hostname;
    return toOrigin(clone);
}
exports.primaryFrontendOrigin = toOrigin(frontendUrl);
exports.allowedFrontendOrigins = (() => {
    const origins = new Set([exports.primaryFrontendOrigin]);
    if (frontendUrl.hostname.startsWith('www.')) {
        origins.add(withHostname(frontendUrl.hostname.slice(4)));
    }
    else {
        origins.add(withHostname(`www.${frontendUrl.hostname}`));
    }
    return Array.from(origins);
})();
function normalizeOrigin(value) {
    try {
        return new URL(value).origin;
    }
    catch {
        return value;
    }
}
function isAllowedFrontendOrigin(origin) {
    if (!origin)
        return true;
    const normalizedOrigin = normalizeOrigin(origin);
    return exports.allowedFrontendOrigins.includes(normalizedOrigin);
}
