"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCourses = listCourses;
exports.getFeatured = getFeatured;
exports.getCategories = getCategories;
exports.searchCourses = searchCourses;
exports.getBySlug = getBySlug;
exports.getCurriculum = getCurriculum;
exports.createCourse = createCourse;
exports.updateCourse = updateCourse;
exports.deleteCourse = deleteCourse;
exports.deleteCourses = deleteCourses;
exports.publishCourse = publishCourse;
exports.notifyCourseUpdate = notifyCourseUpdate;
exports.addSection = addSection;
exports.deleteSection = deleteSection;
exports.reorderSections = reorderSections;
exports.updateSection = updateSection;
exports.getAllAdmin = getAllAdmin;
exports.getById = getById;
exports.recalcStats = recalcStats;
const course_model_1 = require("./course.model");
const lesson_model_1 = require("../lesson/lesson.model");
const cache_1 = require("../../utils/cache");
const apiError_1 = require("../../utils/apiError");
const mongoose_1 = require("mongoose");
const course_queue_1 = require("./course.queue");
const sections_1 = require("../../utils/sections");
const queryBuilder_1 = require("../../utils/queryBuilder");
const StorageService_1 = require("../../storage/StorageService");
const assetPath_1 = require("../../utils/assetPath");
function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function formatCourse(course) {
    return {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.shortDescription,
        thumbnail: (0, assetPath_1.formatAssetPath)(course.thumbnail),
        trailerUrl: course.trailerUrl,
        instructor: {
            ...course.instructor,
            avatar: (0, assetPath_1.formatAssetPath)(course.instructor?.avatar),
        },
        price: course.price,
        originalPrice: course.originalPrice,
        category: course.category,
        tags: course.tags,
        level: course.level,
        language: course.language,
        totalLessons: course.totalLessons,
        totalDuration: course.totalDuration,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        enrollmentCount: course.enrollmentCount,
        rating: course.rating,
        sections: course.sections.map(s => ({
            _id: s._id.toString(),
            title: s.title,
            order: s.order,
            lessons: s.lessons.map(l => l.toString())
        })),
        createdAt: course.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: course.updatedAt?.toISOString() || new Date().toISOString()
    };
}
async function invalidateCache(slug) {
    await cache_1.cache.del('courses:featured');
    await cache_1.cache.del('courses:categories');
    await cache_1.cache.delPattern('courses:list:*');
    if (slug)
        await cache_1.cache.del(`courses:slug:${slug}`);
}
async function listCourses(page = 1, limit = 12, category) {
    const key = `courses:list:${page}:${limit}:${category || 'all'}`;
    return cache_1.cache.getOrSet(key, async () => {
        const filter = { isPublished: true };
        if (category)
            filter.category = category;
        const skip = (page - 1) * limit;
        const [courses, total] = await Promise.all([
            course_model_1.Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            course_model_1.Course.countDocuments(filter)
        ]);
        return {
            courses: courses.map(c => formatCourse(c)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }, 300);
}
async function getFeatured() {
    return cache_1.cache.getOrSet('courses:featured', async () => {
        const courses = await course_model_1.Course.find({ isPublished: true, isFeatured: true }).limit(8).lean();
        return courses.map(c => formatCourse(c));
    }, 600);
}
async function getCategories() {
    return cache_1.cache.getOrSet('courses:categories', async () => {
        const categories = await course_model_1.Course.distinct('category');
        return categories.filter(Boolean).sort();
    }, 3600);
}
async function searchCourses(q, page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    const filter = { isPublished: true, $text: { $search: q } };
    const [courses, total] = await Promise.all([
        course_model_1.Course.find(filter).skip(skip).limit(limit).lean(),
        course_model_1.Course.countDocuments(filter)
    ]);
    return {
        courses: courses.map(c => formatCourse(c)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
async function getBySlug(slug) {
    return cache_1.cache.getOrSet(`courses:slug:${slug}`, async () => {
        const course = await course_model_1.Course.findOne({ slug, isPublished: true }).lean();
        if (!course)
            throw new apiError_1.ApiError(404, 'Course not found');
        return formatCourse(course);
    }, 300);
}
async function getCurriculum(slug) {
    const course = await course_model_1.Course.findOne({ slug }).lean();
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    const lessons = await lesson_model_1.Lesson.find({ courseId: course._id }).sort({ order: 1 }).lean();
    return {
        sections: course.sections.map(s => ({
            _id: s._id.toString(),
            title: s.title,
            order: s.order,
            lessons: lessons
                .filter(l => l.sectionId.toString() === s._id.toString())
                .map(l => ({
                id: l._id.toString(),
                title: l.title,
                order: l.order,
                duration: l.duration,
                isPreview: l.isPreview
            }))
        }))
    };
}
async function createCourse(data) {
    if (data.thumbnail) {
        data.thumbnail = StorageService_1.storageService.extractKey(data.thumbnail);
    }
    let slug = slugify(data.title);
    const existing = await course_model_1.Course.findOne({ slug });
    if (existing)
        slug = `${slug}-${Date.now()}`;
    const course = await course_model_1.Course.create({
        ...data,
        slug,
        originalPrice: data.originalPrice ?? data.price,
        sections: []
    });
    await invalidateCache();
    return formatCourse(course);
}
async function updateCourse(id, data) {
    const oldCourse = await course_model_1.Course.findById(id);
    if (!oldCourse)
        throw new apiError_1.ApiError(404, 'Course not found');
    if (data.thumbnail) {
        data.thumbnail = StorageService_1.storageService.extractKey(data.thumbnail);
    }
    const newThumbnail = data.thumbnail;
    const course = await course_model_1.Course.findByIdAndUpdate(id, data, { new: true });
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    if (newThumbnail && oldCourse.thumbnail && newThumbnail !== oldCourse.thumbnail && !oldCourse.thumbnail.startsWith('http')) {
        await StorageService_1.storageService.deleteFile(oldCourse.thumbnail).catch(() => { });
    }
    await invalidateCache(course.slug);
    return formatCourse(course);
}
async function deleteCourse(id) {
    const course = await course_model_1.Course.findByIdAndDelete(id);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    if (course.thumbnail && !course.thumbnail.startsWith('http')) {
        await StorageService_1.storageService.deleteFile(course.thumbnail).catch(() => { });
    }
    const lessons = await lesson_model_1.Lesson.find({ courseId: id });
    for (const lesson of lessons) {
        await StorageService_1.storageService.deleteDirectory(`videos/${lesson._id}`).catch(() => { });
    }
    await lesson_model_1.Lesson.deleteMany({ courseId: id });
    await invalidateCache(course.slug);
}
async function deleteCourses(ids) {
    if (!ids.length)
        return;
    await course_queue_1.courseQueue.add('bulk_delete', { action: 'bulk_delete', ids });
}
async function publishCourse(id, isPublished) {
    const course = await course_model_1.Course.findByIdAndUpdate(id, { isPublished }, { new: true });
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    await invalidateCache(course.slug);
    if (isPublished) {
        await course_queue_1.courseQueue.add('notify_update', {
            courseId: course._id,
            message: `The course "${course.title}" has been published and is now available!`
        });
    }
    return formatCourse(course);
}
async function notifyCourseUpdate(courseId, message) {
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    await course_queue_1.courseQueue.add('notify_update', { courseId, message });
}
async function addSection(courseId, title, order) {
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    course.sections.push({ _id: new mongoose_1.Types.ObjectId(), title, order, lessons: [] });
    course.sections.sort((a, b) => a.order - b.order);
    await course.save();
    await invalidateCache(course.slug);
    return formatCourse(course);
}
async function deleteSection(courseId, sectionId) {
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    const section = (0, sections_1.findSection)(course.sections, sectionId);
    if (!section)
        throw new apiError_1.ApiError(404, 'Section not found');
    await lesson_model_1.Lesson.deleteMany({ sectionId });
    (0, sections_1.removeSection)(course.sections, sectionId);
    await course.save();
    await invalidateCache(course.slug);
    return formatCourse(course);
}
async function reorderSections(courseId, sectionIds) {
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    course.sections.forEach(section => {
        const newOrder = sectionIds.indexOf(section._id.toString());
        if (newOrder !== -1) {
            section.order = newOrder;
        }
    });
    course.sections.sort((a, b) => a.order - b.order);
    await course.save();
    await invalidateCache(course.slug);
    return formatCourse(course);
}
async function updateSection(courseId, sectionId, title) {
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    const section = (0, sections_1.findSection)(course.sections, sectionId);
    if (!section)
        throw new apiError_1.ApiError(404, 'Section not found');
    section.title = title;
    await course.save();
    await invalidateCache(course.slug);
    return formatCourse(course);
}
async function getAllAdmin(query = {}) {
    const searchFields = ['title', 'slug', 'category', 'tags'];
    const { filterQuery, skip, limit, sort, page } = (0, queryBuilder_1.buildQuery)(query, searchFields);
    const [courses, total] = await Promise.all([
        course_model_1.Course.find(filterQuery).sort(sort).skip(skip).limit(limit).lean(),
        course_model_1.Course.countDocuments(filterQuery)
    ]);
    return {
        courses: courses.map(c => formatCourse(c)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
async function getById(id) {
    const course = await course_model_1.Course.findById(id).lean();
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    return formatCourse(course);
}
async function recalcStats(courseId) {
    const lessons = await lesson_model_1.Lesson.find({ courseId });
    const totalDuration = lessons.reduce((sum, l) => sum + l.duration, 0);
    await course_model_1.Course.findByIdAndUpdate(courseId, {
        totalLessons: lessons.length,
        totalDuration
    });
}
