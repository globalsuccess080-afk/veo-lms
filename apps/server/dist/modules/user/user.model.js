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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const encryption_1 = require("../../utils/encryption");
const enums_1 = require("../../enums");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    emailHash: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: enums_1.USER_ROLES, default: 'student' },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    learningStreak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastActivityDate: { type: Date, default: null },
        totalActiveDays: { type: Number, default: 0 }
    }
}, { timestamps: true });
userSchema.pre('validate', function (next) {
    if (!this.email)
        return next();
    const plainEmail = this.email.includes('@') ? this.email : (0, encryption_1.decrypt)(this.email);
    if (!this.emailHash || this.isModified('email')) {
        this.emailHash = (0, encryption_1.hashEmail)(plainEmail);
        if (this.email.includes('@')) {
            this.email = (0, encryption_1.encrypt)(plainEmail);
        }
    }
    next();
});
userSchema.methods.getDecryptedEmail = function () {
    try {
        return (0, encryption_1.decrypt)(this.email);
    }
    catch {
        return this.email;
    }
};
userSchema.methods.getDecryptedName = function () {
    return this.name;
};
userSchema.index({ role: 1 });
exports.User = mongoose_1.default.model('User', userSchema);
