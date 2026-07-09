"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVideoToken = createVideoToken;
exports.buildAuthorizedPlaylist = buildAuthorizedPlaylist;
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const cache_1 = require("../../utils/cache");
const apiError_1 = require("../../utils/apiError");
const StorageService_1 = require("../../storage/StorageService");
function createVideoToken(data) {
    return jsonwebtoken_1.default.sign({ ...data, type: 'video' }, env_1.env.VIDEO_TOKEN_SECRET, {
        expiresIn: env_1.env.VIDEO_TOKEN_EXPIRY_SECONDS,
        audience: 'veolms-video',
        issuer: 'veolms-api',
    });
}
function verifyVideoToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.VIDEO_TOKEN_SECRET, {
            audience: 'veolms-video',
            issuer: 'veolms-api',
        });
        if (payload.type !== 'video')
            throw new Error('Invalid token type');
        return payload;
    }
    catch {
        throw new apiError_1.ApiError(403, 'Video access token is invalid or expired');
    }
}
function normalizeStorageKey(value) {
    const normalized = path_1.default.posix.normalize(value.replace(/\\/g, '/')).replace(/^\/+/, '');
    if (!normalized || normalized.startsWith('../') || normalized.includes('/../')) {
        throw new apiError_1.ApiError(400, 'Invalid playlist path');
    }
    return normalized;
}
async function readPlaylist(key) {
    const cacheKey = `video:playlist:${key}`;
    try {
        return await cache_1.cache.getOrSet(cacheKey, () => StorageService_1.storageService.readText(key), 1200);
    }
    catch {
        return StorageService_1.storageService.readText(key);
    }
}
function resolveEntry(playlistKey, entry) {
    return normalizeStorageKey(path_1.default.posix.join(path_1.default.posix.dirname(playlistKey), entry.split('?')[0]));
}
async function buildAuthorizedPlaylist(requestedPath, token) {
    const payload = verifyVideoToken(token);
    const playlistKey = normalizeStorageKey(requestedPath);
    const allowedPrefix = `${normalizeStorageKey(payload.storagePath)}/`;
    if (!playlistKey.startsWith(allowedPrefix) || !playlistKey.endsWith('.m3u8')) {
        throw new apiError_1.ApiError(403, 'Playlist is outside the authorized video');
    }
    const source = await readPlaylist(playlistKey);
    const isMaster = playlistKey.endsWith('/master.m3u8');
    const lines = await Promise.all(source.split(/\r?\n/).map(async (line) => {
        const entry = line.trim();
        if (!entry || entry.startsWith('#'))
            return line;
        const key = resolveEntry(playlistKey, entry);
        if (isMaster) {
            if (!key.endsWith('.m3u8'))
                throw new apiError_1.ApiError(500, 'Master playlist contains an invalid entry');
            const relative = path_1.default.posix.relative(path_1.default.posix.dirname(playlistKey), key);
            return `${relative}?token=${encodeURIComponent(token)}`;
        }
        return StorageService_1.storageService.getSignedUrl(key, env_1.env.VIDEO_SEGMENT_URL_EXPIRY_SECONDS);
    }));
    return lines.join('\n');
}
