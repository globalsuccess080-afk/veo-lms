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
const express_1 = require("express");
const ctrl = __importStar(require("./course.controller"));
const router = (0, express_1.Router)();
router.get('/', ctrl.list);
router.get('/featured', ctrl.featured);
router.get('/categories', ctrl.categories);
router.get('/search', ctrl.search);
router.get('/manage/all', ...ctrl.adminList);
router.get('/manage/:id', ...ctrl.getById);
router.get('/:slug/curriculum', ctrl.curriculum);
router.get('/:slug', ctrl.getBySlug);
router.post('/', ...ctrl.create);
router.post('/bulk-delete', ...ctrl.bulkRemove);
router.put('/:id', ...ctrl.update);
router.delete('/:id', ...ctrl.remove);
router.patch('/:id/publish', ...ctrl.publish);
router.post('/:id/sections', ...ctrl.addSection);
router.put('/:id/sections/reorder', ...ctrl.reorderSections);
router.put('/:id/sections/:sectionId', ...ctrl.updateSection);
router.delete('/:id/sections/:sectionId', ...ctrl.removeSection);
exports.default = router;
