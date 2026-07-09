"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("stream/promises");
const mime_types_1 = __importDefault(require("mime-types"));
const env_1 = require("../config/env");
const r2_1 = require("../config/r2");
class StorageService {
    bucket = env_1.env.R2_BUCKET_NAME;
    publicUrl = env_1.env.R2_PUBLIC_URL.replace(/\/$/, ''); // Ensure no trailing slash
    getPublicUrl(keyOrUrl) {
        if (!keyOrUrl)
            return keyOrUrl;
        const key = this.extractKey(keyOrUrl);
        return `${this.publicUrl}/${key.replace(/^\//, '')}`;
    }
    extractKey(urlOrKey) {
        if (!urlOrKey)
            return urlOrKey;
        if (/^https?:\/\//i.test(urlOrKey)) {
            try {
                return decodeURIComponent(new URL(urlOrKey).pathname).replace(/^\//, '');
            }
            catch {
                return urlOrKey;
            }
        }
        return urlOrKey.replace(/^\//, '');
    }
    async getSignedUrl(key, expiresIn = 3600) {
        const getCommand = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(r2_1.r2Client, getCommand, { expiresIn });
    }
    async readText(key) {
        const response = await r2_1.r2Client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
        if (!response.Body)
            throw new Error(`Storage object has no body: ${key}`);
        return response.Body.transformToString('utf-8');
    }
    /**
     * Downloads an R2 object and writes it to `localPath`.
     * Creates parent directories as needed.
     */
    async downloadFile(key, localPath) {
        await fs_1.default.promises.mkdir(path_1.default.dirname(localPath), { recursive: true });
        const response = await r2_1.r2Client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
        if (!response.Body)
            throw new Error(`Storage object has no body: ${key}`);
        const writeStream = fs_1.default.createWriteStream(localPath);
        await (0, promises_1.pipeline)(response.Body, writeStream);
    }
    async uploadFile(localPath, key) {
        // Read into buffer so ContentLength is always known — avoids the AWS SDK
        // "Invalid value undefined for x-amz-decoded-content-length" error that
        // occurs when piping a stream without providing ContentLength explicitly.
        const { size } = await fs_1.default.promises.stat(localPath);
        const body = fs_1.default.createReadStream(localPath);
        const contentType = mime_types_1.default.lookup(localPath) || 'application/octet-stream';
        const extension = path_1.default.extname(localPath).toLowerCase();
        const cacheControl = extension === '.m3u8' || extension === '.ts'
            ? 'private, max-age=0, no-store'
            : 'public, max-age=31536000, immutable';
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            ContentLength: size,
            CacheControl: cacheControl,
        });
        await r2_1.r2Client.send(command);
        return {
            key,
            url: this.getPublicUrl(key)
        };
    }
    async uploadBuffer(buffer, key, contentType = 'application/octet-stream') {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });
        await r2_1.r2Client.send(command);
        return {
            key,
            url: this.getPublicUrl(key)
        };
    }
    async uploadDirectory(localDirectory, destinationPrefix, onProgress, concurrency = 10) {
        // Collect all files recursively first
        const allFiles = [];
        const collect = async (dir, prefix) => {
            const entries = await fs_1.default.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry.name);
                const relKey = path_1.default.posix.join(prefix, entry.name);
                if (entry.isDirectory()) {
                    await collect(fullPath, relKey);
                }
                else {
                    allFiles.push({ localPath: fullPath, key: relKey });
                }
            }
        };
        await collect(localDirectory, destinationPrefix);
        const total = allFiles.length;
        let uploaded = 0;
        // Upload in parallel batches of `concurrency`
        let nextIndex = 0;
        const worker = async () => {
            while (nextIndex < allFiles.length) {
                const file = allFiles[nextIndex++];
                await this.uploadFile(file.localPath, file.key);
                uploaded += 1;
                onProgress?.(uploaded, total);
            }
        };
        await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
    }
    async deleteFile(key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        await r2_1.r2Client.send(command);
    }
    async deleteDirectory(prefix) {
        // R2 doesn't have a real directory delete, we must list and delete
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
        });
        let isTruncated = true;
        let continuationToken;
        while (isTruncated) {
            listCommand.input.ContinuationToken = continuationToken;
            const response = await r2_1.r2Client.send(listCommand);
            if (!response.Contents || response.Contents.length === 0)
                break;
            const deletePromises = response.Contents.map(obj => {
                if (obj.Key) {
                    return this.deleteFile(obj.Key);
                }
            });
            await Promise.all(deletePromises);
            isTruncated = response.IsTruncated ?? false;
            continuationToken = response.NextContinuationToken;
        }
    }
    async exists(key) {
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await r2_1.r2Client.send(command);
            return true;
        }
        catch (err) {
            if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw err;
        }
    }
    async copy(sourceKey, targetKey) {
        const command = new client_s3_1.CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${sourceKey}`,
            Key: targetKey,
        });
        await r2_1.r2Client.send(command);
    }
    async move(sourceKey, targetKey) {
        await this.copy(sourceKey, targetKey);
        await this.deleteFile(sourceKey);
    }
    async getMetadata(key) {
        const command = new client_s3_1.HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const response = await r2_1.r2Client.send(command);
        return {
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            eTag: response.ETag,
            lastModified: response.LastModified,
            metadata: response.Metadata,
        };
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
