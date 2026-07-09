"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const mongoose_1 = __importDefault(require("mongoose"));
const course_model_1 = require("../course/course.model");
const user_model_1 = require("../user/user.model");
const enrollment_model_1 = require("../enrollment/enrollment.model");
const payment_model_1 = require("../payment/payment.model");
const progress_model_1 = require("../progress/progress.model");
const coupon_model_1 = require("../coupon/coupon.model");
const redis_1 = require("../../config/redis");
async function getDashboard(userId, range) {
    const cacheKey = `analytics:tenant:${userId}:${range}`;
    // Attempt cache hit
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        }
        catch { }
    }
    const now = new Date();
    const startDate = new Date();
    switch (range) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        case 'this_year':
            startDate.setFullYear(now.getFullYear(), 0, 1);
            break;
        case '30d':
        default:
            startDate.setDate(now.getDate() - 30);
            break;
    }
    // --- AGGREGATIONS ---
    const [revenueData, studentsData, coursesData, engagementData, revenueTrends, revenueByCategory, revenueByCoupon, studentGrowth, announcementsCount, topCourses, couponStats, lessonAnalytics] = await Promise.all([
        // Revenue (Total, This Range)
        payment_model_1.Payment.aggregate([
            { $match: { status: 'paid' } },
            { $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    rangeTotal: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, '$amount', 0] } },
                    countRange: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
                } }
        ]),
        // Students
        user_model_1.User.aggregate([
            { $match: { role: 'student' } },
            { $group: {
                    _id: null,
                    total: { $sum: 1 },
                    newRange: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
                } }
        ]),
        // Courses
        course_model_1.Course.aggregate([
            { $group: {
                    _id: null,
                    total: { $sum: 1 },
                    published: { $sum: { $cond: ['$isPublished', 1, 0] } },
                    draft: { $sum: { $cond: [{ $not: '$isPublished' }, 1, 0] } }
                } }
        ]),
        // Engagement (Watch Time, Lessons Completed)
        progress_model_1.Progress.aggregate([
            { $group: {
                    _id: null,
                    totalWatchTimeSeconds: { $sum: '$watchedSeconds' },
                    completedLessons: { $sum: { $cond: ['$isCompleted', 1, 0] } }
                } }
        ]),
        // Revenue Trends
        payment_model_1.Payment.aggregate([
            { $match: { status: 'paid', createdAt: { $gte: startDate } } },
            { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$amount' }
                } },
            { $sort: { _id: 1 } }
        ]),
        // Revenue Breakdown: Category
        payment_model_1.Payment.aggregate([
            { $match: { status: 'paid', createdAt: { $gte: startDate } } },
            { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
            { $unwind: '$course' },
            { $group: { _id: '$course.category', revenue: { $sum: '$amount' } } },
            { $sort: { revenue: -1 } }
        ]),
        // Revenue Breakdown: Coupon
        payment_model_1.Payment.aggregate([
            { $match: { status: 'paid', createdAt: { $gte: startDate }, couponCode: { $ne: null } } },
            { $group: { _id: '$couponCode', revenue: { $sum: '$amount' }, usageCount: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]),
        // Student Growth
        user_model_1.User.aggregate([
            { $match: { role: 'student', createdAt: { $gte: startDate } } },
            { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    students: { $sum: 1 }
                } },
            { $sort: { _id: 1 } }
        ]),
        // Announcements
        mongoose_1.default.model('Announcement').countDocuments({ createdAt: { $gte: startDate } }),
        // Top Performing Courses & Funnel
        course_model_1.Course.aggregate([
            { $lookup: { from: 'payments', localField: '_id', foreignField: 'courseId', as: 'payments' } },
            { $lookup: { from: 'enrollments', localField: '_id', foreignField: 'courseId', as: 'enrollments' } },
            { $lookup: { from: 'progresses', localField: '_id', foreignField: 'courseId', as: 'progresses' } },
            { $project: {
                    title: 1,
                    revenue: {
                        $sum: {
                            $map: {
                                input: { $filter: { input: '$payments', as: 'p', cond: { $eq: ['$$p.status', 'paid'] } } },
                                as: 'paidP',
                                in: '$$paidP.amount'
                            }
                        }
                    },
                    purchased: { $size: { $filter: { input: '$payments', as: 'p', cond: { $eq: ['$$p.status', 'paid'] } } } },
                    started: { $size: { $filter: { input: '$enrollments', as: 'e', cond: { $gt: ['$$e.progress', 0] } } } },
                    completed: { $size: { $filter: { input: '$enrollments', as: 'e', cond: { $eq: ['$$e.progress', 100] } } } },
                    watchTimeSeconds: { $sum: '$progresses.watchedSeconds' }
                } },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]),
        // Coupon Global Stats
        coupon_model_1.CouponUsage.aggregate([
            { $group: {
                    _id: '$couponCode',
                    totalDiscount: { $sum: '$discountAmount' },
                    uses: { $sum: 1 }
                } },
            { $sort: { uses: -1 } },
            { $limit: 5 }
        ]),
        // In-depth Lesson Analytics
        progress_model_1.Progress.aggregate([
            { $group: {
                    _id: '$lessonId',
                    courseId: { $first: '$courseId' },
                    totalWatchTimeSeconds: { $sum: '$watchedSeconds' },
                    avgWatchTimeSeconds: { $avg: '$watchedSeconds' },
                    started: { $sum: 1 },
                    completed: { $sum: { $cond: ['$isCompleted', 1, 0] } }
                } },
            { $sort: { totalWatchTimeSeconds: -1 } },
            { $limit: 20 },
            { $lookup: { from: 'lessons', localField: '_id', foreignField: '_id', as: 'lesson' } },
            { $unwind: '$lesson' },
            { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
            { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
            { $project: {
                    title: '$lesson.title',
                    courseTitle: '$course.title',
                    duration: '$lesson.duration',
                    totalWatchTimeSeconds: 1,
                    avgWatchTimeSeconds: 1,
                    started: 1,
                    completed: 1
                } }
        ])
    ]);
    const totalRev = revenueData[0]?.total || 0;
    const rangeRev = revenueData[0]?.rangeTotal || 0;
    const orderCount = revenueData[0]?.countRange || 0;
    const avgOrderValue = orderCount > 0 ? (rangeRev / orderCount).toFixed(0) : 0;
    // Completion rate overall calculation
    // Average progress of all enrollments
    const completionStats = await enrollment_model_1.Enrollment.aggregate([
        { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
    ]);
    const dashboardData = {
        overview: {
            revenue: {
                total: totalRev,
                range: rangeRev,
                avgOrderValue,
                growth: 0 // Would require previous period comparison
            },
            students: {
                total: studentsData[0]?.total || 0,
                newRange: studentsData[0]?.newRange || 0,
            },
            announcements: {
                sentRange: announcementsCount || 0
            },
            courses: {
                total: coursesData[0]?.total || 0,
                published: coursesData[0]?.published || 0,
                draft: coursesData[0]?.draft || 0
            },
            engagement: {
                watchTimeHours: ((engagementData[0]?.totalWatchTimeSeconds || 0) / 3600).toFixed(1),
                lessonsCompleted: engagementData[0]?.completedLessons || 0,
                completionRate: (completionStats[0]?.avgProgress || 0).toFixed(1)
            }
        },
        trends: {
            revenue: revenueTrends.map(t => ({ date: t._id, revenue: t.revenue })),
            students: studentGrowth.map(t => ({ date: t._id, students: t.students }))
        },
        breakdowns: {
            category: revenueByCategory.map(c => ({ name: c._id, value: c.revenue })),
            coupons: revenueByCoupon.map(c => ({ name: c._id, revenue: c.revenue, uses: c.usageCount }))
        },
        topCourses: topCourses.map(c => ({
            id: c._id,
            title: c.title,
            revenue: c.revenue,
            purchased: c.purchased,
            started: c.started,
            completed: c.completed,
            conversionFromStart: c.purchased > 0 ? ((c.started / c.purchased) * 100).toFixed(1) : 0,
            completionRate: c.started > 0 ? ((c.completed / c.started) * 100).toFixed(1) : 0,
            watchTimeHours: (c.watchTimeSeconds / 3600).toFixed(1)
        })),
        lessonAnalytics: lessonAnalytics.map(l => ({
            id: l._id,
            title: l.title,
            courseTitle: l.courseTitle || 'Unknown Course',
            duration: l.duration,
            totalWatchTimeHours: (l.totalWatchTimeSeconds / 3600).toFixed(1),
            avgWatchTimeMinutes: (l.avgWatchTimeSeconds / 60).toFixed(1),
            started: l.started,
            completed: l.completed,
            completionRate: l.started > 0 ? ((l.completed / l.started) * 100).toFixed(1) : 0
        })),
        couponStats: couponStats.map(c => ({
            code: c._id,
            totalDiscount: c.totalDiscount,
            uses: c.uses
        }))
    };
    // Cache for 15 minutes (900 seconds)
    await redis_1.redis.setex(cacheKey, 900, JSON.stringify(dashboardData));
    return dashboardData;
}
