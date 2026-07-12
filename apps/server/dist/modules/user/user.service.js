"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const user_model_1 = require("./user.model");
const apiError_1 = require("../../utils/apiError");
const StorageService_1 = require("../../storage/StorageService");
const assetPath_1 = require("../../utils/assetPath");
const password_1 = require("../../utils/password");
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
    const valid = await (0, password_1.verifyPassword)(currentPassword, user.password);
    if (!valid)
        throw new apiError_1.ApiError(400, 'Current password is incorrect');
    user.password = await (0, password_1.hashPassword)(newPassword);
    await user.save();
}
