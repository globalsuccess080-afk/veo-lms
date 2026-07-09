"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const socket_1 = require("./config/socket");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const videoSocket_1 = require("./utils/videoSocket");
async function start() {
    await (0, db_1.connectDB)();
    const httpServer = (0, http_1.createServer)(app_1.default);
    const io = (0, socket_1.setupSocket)(httpServer);
    app_1.default.set('io', io);
    (0, videoSocket_1.initVideoSocket)(io);
    httpServer.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.PORT}`);
    });
}
start().catch((err) => {
    logger_1.logger.error('Failed to start server', { error: err.message });
    process.exit(1);
});
