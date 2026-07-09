"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../../enums");
const video_types_1 = require("../video/video.types");
const lessonSchema = new mongoose_1.Schema({
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true },
    sectionId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    duration: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    video: {
        status: { type: String, enum: enums_1.VIDEO_STATUSES, default: 'pending' },
        progress: { type: Number, default: 0 },
        stage: { type: String, enum: video_types_1.VIDEO_STAGES, default: 'QUEUED' },
        message: { type: String, default: '' },
        etaSeconds: { type: Number, default: null },
        currentQuality: { type: String, default: '' },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        failedReason: { type: String, default: '' },
        jobId: { type: String, default: null },
        storageProvider: { type: String, default: 'local' },
        originalKey: { type: String, default: '' },
        masterPlaylistKey: { type: String, default: '' },
        storagePath: { type: String, default: '' },
        version: { type: String, default: '' },
        availableQualities: { type: [String], default: [] },
        transcodedAt: { type: Date, default: null },
        thumbnail: {
            small: { type: String, default: '' },
            medium: { type: String, default: '' },
            large: { type: String, default: '' }
        },
        metadata: {
            duration: { type: Number, default: 0 },
            width: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
            fps: { type: Number, default: 0 },
            codec: { type: String, default: '' },
            bitrate: { type: Number, default: 0 }
        },
        youtubeUrl: { type: String, default: '' },
        completedQualities: { type: [String], default: [] }
    },
    resources: [{
            title: { type: String },
            url: { type: String },
            type: { type: String },
            size: { type: Number }
        }]
}, { timestamps: true });
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, isPreview: 1 });
exports.Lesson = mongoose_1.default.model('Lesson', lessonSchema);
