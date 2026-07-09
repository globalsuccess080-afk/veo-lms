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
exports.getById = exports.adminList = exports.updateSection = exports.reorderSections = exports.removeSection = exports.addSection = exports.publish = exports.bulkRemove = exports.remove = exports.update = exports.create = exports.curriculum = exports.getBySlug = exports.search = exports.categories = exports.featured = exports.list = void 0;
const shared_1 = require("@veolms/shared");
const courseService = __importStar(require("./course.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const params_1 = require("../../utils/params");
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const result = await courseService.listCourses(page, limit, category);
    (0, apiResponse_1.sendSuccess)(res, result.courses, 'Success', 200, {
        page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
    });
});
exports.featured = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const courses = await courseService.getFeatured();
    (0, apiResponse_1.sendSuccess)(res, courses);
});
exports.categories = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const categories = await courseService.getCategories();
    (0, apiResponse_1.sendSuccess)(res, categories);
});
exports.search = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const q = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const result = await courseService.searchCourses(q, page);
    (0, apiResponse_1.sendSuccess)(res, result.courses, 'Success', 200, {
        page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
    });
});
exports.getBySlug = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const course = await courseService.getBySlug((0, params_1.param)(req.params.slug));
    (0, apiResponse_1.sendSuccess)(res, course);
});
exports.curriculum = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await courseService.getCurriculum((0, params_1.param)(req.params.slug));
    (0, apiResponse_1.sendSuccess)(res, data);
});
exports.create = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, validate_middleware_1.validate)(shared_1.createCourseSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.createCourse(req.body);
        (0, apiResponse_1.sendSuccess)(res, course, 'Course created', 201);
    })
];
exports.update = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, validate_middleware_1.validate)(shared_1.updateCourseSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.updateCourse((0, params_1.param)(req.params.id), req.body);
        (0, apiResponse_1.sendSuccess)(res, course, 'Course updated');
    })
];
exports.remove = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await courseService.deleteCourse((0, params_1.param)(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, null, 'Course deleted');
    })
];
exports.bulkRemove = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return (0, apiResponse_1.sendSuccess)(res, null, 'No courses provided', 400);
        }
        await courseService.deleteCourses(ids);
        (0, apiResponse_1.sendSuccess)(res, null, `Deletion of ${ids.length} courses started in background. They will disappear shortly.`);
    })
];
exports.publish = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.publishCourse((0, params_1.param)(req.params.id), req.body.isPublished);
        (0, apiResponse_1.sendSuccess)(res, course);
    })
];
exports.addSection = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, validate_middleware_1.validate)(shared_1.createSectionSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.addSection((0, params_1.param)(req.params.id), req.body.title, req.body.order);
        (0, apiResponse_1.sendSuccess)(res, course, 'Section added', 201);
    })
];
exports.removeSection = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.deleteSection((0, params_1.param)(req.params.id), (0, params_1.param)(req.params.sectionId));
        (0, apiResponse_1.sendSuccess)(res, course, 'Section deleted');
    })
];
exports.reorderSections = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.reorderSections((0, params_1.param)(req.params.id), req.body.sectionIds);
        (0, apiResponse_1.sendSuccess)(res, course, 'Sections reordered');
    })
];
exports.updateSection = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.updateSection((0, params_1.param)(req.params.id), (0, params_1.param)(req.params.sectionId), req.body.title);
        (0, apiResponse_1.sendSuccess)(res, course, 'Section updated');
    })
];
exports.adminList = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await courseService.getAllAdmin(req.query);
        (0, apiResponse_1.sendSuccess)(res, result.courses, 'Success', 200, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
        });
    })
];
exports.getById = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const course = await courseService.getById((0, params_1.param)(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, course);
    })
];
