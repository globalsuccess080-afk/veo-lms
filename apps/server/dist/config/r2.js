"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const node_http_handler_1 = require("@smithy/node-http-handler");
const env_1 = require("./env");
exports.r2Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: env_1.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: env_1.env.R2_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.R2_SECRET_ACCESS_KEY,
    },
    requestHandler: new node_http_handler_1.NodeHttpHandler({
        connectionTimeout: 10000, // 10s to establish TCP connection
        requestTimeout: 120000, // 2 min per request (each segment upload)
    }),
});
