"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("./user.model");
const apiError_1 = require("../../utils/apiError");
const StorageService_1 = require("../../storage/StorageService");
const assetPath_1 = require("../../utils/assetPath");
async function updateProfile(userId, name, avatar) {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new apiError_1.ApiError(404, 'User not found');
    if (name)
        user.name = name;
    if (avatar !== undefined) {
        if (avatar && user.avatar && avatar !== user.avatar && !user.avatar.startsWith('http')) {
            await StorageService_1.storageService.deleteFile(user.avatar).catch(() => { });
        }
        user.avatar = avatar ? StorageService_1.storageService.extractKey(avatar) : avatar;
    }
    await user.save();
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.getDecryptedEmail(),
        role: user.role,
        avatar: user.avatar ? (0, assetPath_1.formatAssetPath)(user.avatar) : user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString()
    };
}
async function changePassword(userId, currentPassword, newPassword) {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new apiError_1.ApiError(404, 'User not found');
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!valid)
        throw new apiError_1.ApiError(400, 'Current password is incorrect');
    user.password = await bcryptjs_1.default.hash(newPassword, 12);
    await user.save();
}
