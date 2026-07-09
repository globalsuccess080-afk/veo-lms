"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const role = process.env.SERVICE_ROLE;
const isWorker = role === 'worker';
const entry = isWorker ? 'dist/worker.js' : 'dist/server.js';
console.log(`Starting ${isWorker ? 'worker' : 'server'} process: ${entry}`);
const result = (0, child_process_1.spawnSync)(process.execPath, [entry], { stdio: 'inherit' });
process.exit(result.status ?? 1);
