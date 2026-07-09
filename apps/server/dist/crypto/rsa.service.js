"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicKey = getPublicKey;
exports.decryptAESKey = decryptAESKey;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const apiError_1 = require("../utils/apiError");
// Load keys from environment (expecting base64 encoded PEM to avoid multiline .env issues)
// In production, these should be strictly managed and not hardcoded
const publicKeyPem = env_1.env.RSA_PUBLIC_KEY ? Buffer.from(env_1.env.RSA_PUBLIC_KEY, 'base64').toString('utf8') : '';
const privateKeyPem = env_1.env.RSA_PRIVATE_KEY ? Buffer.from(env_1.env.RSA_PRIVATE_KEY, 'base64').toString('utf8') : '';
if (env_1.env.ENABLE_PAYLOAD_ENCRYPTION && (!publicKeyPem || !privateKeyPem)) {
    console.warn('WARNING: Payload encryption is enabled but RSA keys are missing from environment.');
}
/**
 * Returns the RSA Public Key (PEM format) exposed to the frontend.
 */
function getPublicKey() {
    return publicKeyPem;
}
/**
 * Decrypts the AES session key using the backend RSA Private Key.
 * @param encryptedKeyBase64 The base64-encoded encrypted AES key from the frontend
 * @returns The decrypted AES key as a Buffer
 */
function decryptAESKey(encryptedKeyBase64) {
    if (!privateKeyPem) {
        throw new apiError_1.ApiError(500, 'RSA Private Key is not configured on the server');
    }
    try {
        const encryptedBuffer = Buffer.from(encryptedKeyBase64, 'base64');
        const decryptedBuffer = crypto_1.default.privateDecrypt({
            key: privateKeyPem,
            padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        }, encryptedBuffer);
        return decryptedBuffer;
    }
    catch (error) {
        throw new apiError_1.ApiError(400, 'Failed to decrypt AES session key');
    }
}
