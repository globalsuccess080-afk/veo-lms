"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResource = exports.uploadImage = exports.uploadVideo = exports.HLS_DIR = exports.RESOURCE_DIR = exports.IMAGE_DIR = exports.VIDEO_DIR = exports.UPLOAD_ROOT = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
exports.UPLOAD_ROOT = path_1.default.resolve(process.cwd(), 'uploads/temp');
exports.VIDEO_DIR = path_1.default.join(exports.UPLOAD_ROOT, 'videos');
exports.IMAGE_DIR = path_1.default.join(exports.UPLOAD_ROOT, 'images');
exports.RESOURCE_DIR = path_1.default.join(exports.UPLOAD_ROOT, 'resources');
exports.HLS_DIR = path_1.default.join(exports.UPLOAD_ROOT, 'hls');
fs_1.default.mkdirSync(exports.VIDEO_DIR, { recursive: true });
fs_1.default.mkdirSync(exports.IMAGE_DIR, { recursive: true });
fs_1.default.mkdirSync(exports.RESOURCE_DIR, { recursive: true });
fs_1.default.mkdirSync(exports.HLS_DIR, { recursive: true });
function diskStorage(dir, fallbackExt) {
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, dir),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || fallbackExt;
            cb(null, `${crypto_1.default.randomUUID()}${ext}`);
        }
    });
}
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const ALLOWED_RESOURCE = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
];
exports.uploadVideo = (0, multer_1.default)({
    storage: diskStorage(exports.VIDEO_DIR, '.mp4'),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_VIDEO.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Only video files are allowed (mp4, webm, mov, mkv)'));
    }
});
exports.uploadImage = (0, multer_1.default)({
    storage: diskStorage(exports.IMAGE_DIR, '.jpg'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Only image files are allowed (jpg, png, webp, gif, avif)'));
    }
});
exports.uploadResource = (0, multer_1.default)({
    storage: diskStorage(exports.RESOURCE_DIR, ''),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_RESOURCE.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Invalid resource file type'));
    }
});
