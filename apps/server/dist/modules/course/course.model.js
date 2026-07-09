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
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../../enums");
const sectionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    order: { type: Number, required: true },
    lessons: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Lesson' }]
});
const courseSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    trailerUrl: { type: String, default: '' },
    instructor: {
        name: { type: String, required: true },
        bio: { type: String, default: '' },
        avatar: { type: String, default: '' }
    },
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number, default: 0 },
    category: { type: String, required: true },
    tags: [{ type: String }],
    level: { type: String, enum: enums_1.COURSE_LEVELS, default: 'beginner' },
    language: { type: String, default: 'English' },
    totalLessons: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    enrollmentCount: { type: Number, default: 0 },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    sections: [sectionSchema]
}, { timestamps: true });
courseSchema.index({ isPublished: 1, isFeatured: 1 });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
exports.Course = mongoose_1.default.model('Course', courseSchema);
