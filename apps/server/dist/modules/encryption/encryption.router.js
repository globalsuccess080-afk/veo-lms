"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rsa_service_1 = require("../../crypto/rsa.service");
const router = (0, express_1.Router)();
router.get('/public-key', (_req, res) => {
    const publicKey = (0, rsa_service_1.getPublicKey)();
    if (!publicKey) {
        return res.status(500).json({ success: false, message: 'RSA Public Key is not configured' });
    }
    res.json({ success: true, data: { publicKey } });
});
exports.default = router;
