"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVideoSocket = initVideoSocket;
exports.emitVideoProgress = emitVideoProgress;
exports.emitVideoComplete = emitVideoComplete;
exports.emitVideoFailed = emitVideoFailed;
let _io = null;
function initVideoSocket(io) {
    _io = io;
}
function emitVideoProgress(event) {
    if (!_io)
        return;
    // Emit to admin room so all admin tabs receive it
    _io.to('role:admin').emit('video:progress', event);
}
function emitVideoComplete(lessonId, jobId) {
    if (!_io)
        return;
    _io.to('role:admin').emit('video:complete', { lessonId, jobId });
}
function emitVideoFailed(lessonId, jobId, error) {
    if (!_io)
        return;
    _io.to('role:admin').emit('video:failed', { lessonId, jobId, error });
}
