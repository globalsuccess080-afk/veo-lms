"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalEncryptionMiddleware = globalEncryptionMiddleware;
const env_1 = require("../config/env");
const rsa_service_1 = require("./rsa.service");
const aes_service_1 = require("./aes.service");
const apiError_1 = require("../utils/apiError");
const ENCRYPTABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
function globalEncryptionMiddleware(req, res, next) {
    if (!env_1.env.ENABLE_PAYLOAD_ENCRYPTION ||
        !ENCRYPTABLE_METHODS.includes(req.method) ||
        // Skip if it's a file upload request (multipart/form-data)
        req.headers['content-type']?.includes('multipart/form-data')) {
        return next();
    }
    const { encryptedKey, data, iv, tag } = req.body;
    if (!encryptedKey || !data || !iv || !tag) {
        return next(new apiError_1.ApiError(400, 'Invalid encrypted payload format'));
    }
    let aesKeyBuffer = null;
    try {
        // 1. Decrypt AES Key using RSA Private Key
        aesKeyBuffer = (0, rsa_service_1.decryptAESKey)(encryptedKey);
        // 2. Decrypt the request payload
        const decryptedString = (0, aes_service_1.decryptPayload)(data, iv, tag, aesKeyBuffer);
        req.body = JSON.parse(decryptedString);
    }
    catch (error) {
        if (aesKeyBuffer) {
            aesKeyBuffer.fill(0); // Securely wipe the key
            aesKeyBuffer = null;
        }
        return next(new apiError_1.ApiError(400, 'Failed to decrypt request payload'));
    }
    // 3. Intercept the response to encrypt it before sending
    const originalJson = res.json.bind(res);
    // @ts-ignore
    res.json = (body) => {
        if (!aesKeyBuffer) {
            return originalJson(body);
        }
        try {
            const responseString = JSON.stringify(body);
            const { encryptedData, iv: outIv, authTag } = (0, aes_service_1.encryptPayload)(responseString, aesKeyBuffer);
            const encryptedResponse = {
                data: encryptedData,
                iv: outIv,
                tag: authTag
                // encryptedKey is omitted because the frontend already has the session key
            };
            // 4. Securely destroy the AES key from memory
            aesKeyBuffer.fill(0);
            aesKeyBuffer = null;
            return originalJson(encryptedResponse);
        }
        catch (error) {
            if (aesKeyBuffer) {
                aesKeyBuffer.fill(0);
                aesKeyBuffer = null;
            }
            return originalJson({
                success: false,
                message: 'Failed to encrypt response payload'
            });
        }
    };
    next();
}
