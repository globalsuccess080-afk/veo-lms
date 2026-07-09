"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
class CleanupService {
    /**
     * Deletes a file or directory gracefully, catching ENOENT if it doesn't exist.
     */
    static async deletePath(targetPath) {
        try {
            const stats = await promises_1.default.stat(targetPath);
            if (stats.isDirectory()) {
                await promises_1.default.rm(targetPath, { recursive: true, force: true });
            }
            else {
                await promises_1.default.unlink(targetPath);
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
}
exports.CleanupService = CleanupService;
