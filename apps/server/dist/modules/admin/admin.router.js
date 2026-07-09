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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ctrl = __importStar(require("./admin.controller"));
const couponCtrl = __importStar(require("../coupon/coupon.controller"));
const announcement_router_1 = __importDefault(require("../announcement/announcement.router"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
const router = (0, express_1.Router)();
const adminAuth = [auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)('admin')];
router.get('/stats', ...ctrl.stats);
router.get('/students', ...ctrl.students);
router.patch('/students/:id', ...ctrl.toggleStudent);
router.get('/enrollments', ...ctrl.enrollments);
router.get('/export/courses', ...ctrl.exportCourses);
router.get('/export/students', ...ctrl.exportStudents);
router.get('/export/enrollments', ...ctrl.exportEnrollments);
router.post('/import/courses', adminAuth, upload.single('file'), ctrl.importCourses);
router.post('/import/students', adminAuth, upload.single('file'), ctrl.importStudents);
router.get('/jobs/:id', ...ctrl.getJobStatus);
router.use('/announcements', announcement_router_1.default);
// Admin Coupon Routes
router.get('/coupons', adminAuth, couponCtrl.getAll);
router.get('/coupons/:id', adminAuth, couponCtrl.getById);
router.post('/coupons', adminAuth, couponCtrl.create);
router.put('/coupons/:id', adminAuth, couponCtrl.update);
router.patch('/coupons/:id/status', adminAuth, couponCtrl.updateStatus);
router.delete('/coupons/:id', adminAuth, couponCtrl.remove);
exports.default = router;
