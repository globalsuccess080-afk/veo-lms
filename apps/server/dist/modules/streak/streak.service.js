"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLearningStreak = updateLearningStreak;
exports.getCurrentStreak = getCurrentStreak;
exports.getStreakHistory = getStreakHistory;
exports.getAdminLeaderboard = getAdminLeaderboard;
const user_model_1 = require("../user/user.model");
const streak_history_model_1 = require("./streak-history.model");
const notification_model_1 = require("../notification/notification.model");
const logger_1 = require("../../utils/logger");
/**
 * Returns the current date in IST timezone as a YYYY-MM-DD string.
 */
function getISTDateString(date = new Date()) {
    // IST is UTC + 5:30
    // Instead of complex intl formatters, we can just add 5.5 hours to UTC and grab the ISO date part
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toISOString().split('T')[0];
}
/**
 * Parses a YYYY-MM-DD IST string back to a Date object representing midnight IST
 */
function getMidnightISTFromDateString(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a UTC date, then subtract 5.5 hours to represent that moment in UTC
    const d = new Date(Date.UTC(year, month - 1, day));
    return new Date(d.getTime() - (5.5 * 60 * 60 * 1000));
}
function getYesterdayISTDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getISTDateString(d);
}
async function updateLearningStreak(userId) {
    try {
        const todayStr = getISTDateString();
        const yesterdayStr = getYesterdayISTDateString();
        // 1. Check if history already exists for today
        const existingHistory = await streak_history_model_1.StreakHistory.findOne({ userId, dateString: todayStr });
        if (existingHistory) {
            // Already credited for today
            return;
        }
        // 2. Load user to update streak
        const user = await user_model_1.User.findById(userId);
        if (!user)
            return;
        let currentStreak = user.learningStreak?.current || 0;
        let longestStreak = user.learningStreak?.longest || 0;
        let totalActiveDays = user.learningStreak?.totalActiveDays || 0;
        const lastActivityDate = user.learningStreak?.lastActivityDate;
        let lastActivityStr = '';
        if (lastActivityDate) {
            lastActivityStr = getISTDateString(lastActivityDate);
        }
        // 3. Algorithm
        if (lastActivityStr === yesterdayStr) {
            // Case 1: Learned yesterday
            currentStreak += 1;
        }
        else {
            // Case 3: Missed a day or first time
            currentStreak = 1;
        }
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }
        totalActiveDays += 1;
        // 4. Save User
        const updatedDate = getMidnightISTFromDateString(todayStr);
        await user_model_1.User.findByIdAndUpdate(userId, {
            $set: {
                'learningStreak.current': currentStreak,
                'learningStreak.longest': longestStreak,
                'learningStreak.lastActivityDate': updatedDate,
                'learningStreak.totalActiveDays': totalActiveDays
            }
        });
        // 5. Save History
        await streak_history_model_1.StreakHistory.create({
            userId,
            dateString: todayStr
        });
        // 6. Check Milestones
        const milestones = [3, 7, 15, 30];
        if (milestones.includes(currentStreak)) {
            let title = 'Learning Milestone!';
            if (currentStreak === 3)
                title = 'Consistency Started';
            if (currentStreak === 7)
                title = 'One Week Streak';
            if (currentStreak === 15)
                title = 'Dedicated Learner';
            if (currentStreak === 30)
                title = 'Learning Champion';
            await notification_model_1.Notification.create({
                userId,
                title,
                message: `🎉 Congratulations! You reached a ${currentStreak}-day learning streak. Keep it up!`,
                type: 'system',
                isRead: false
            });
        }
    }
    catch (err) {
        logger_1.logger.error(`Error updating learning streak for user ${userId}:`, err);
    }
}
async function getCurrentStreak(userId) {
    const user = await user_model_1.User.findById(userId).lean();
    if (!user)
        return null;
    // If the last activity wasn't today or yesterday, the "current" streak is effectively broken
    // We should return 0 if they haven't learned yesterday or today
    const todayStr = getISTDateString();
    const yesterdayStr = getYesterdayISTDateString();
    let current = user.learningStreak?.current || 0;
    if (user.learningStreak?.lastActivityDate) {
        const lastStr = getISTDateString(user.learningStreak.lastActivityDate);
        if (lastStr !== todayStr && lastStr !== yesterdayStr) {
            current = 0; // Streak broken
        }
    }
    return {
        current,
        longest: user.learningStreak?.longest || 0,
        activeDays: user.learningStreak?.totalActiveDays || 0
    };
}
async function getStreakHistory(userId) {
    // Returns last 7 days history
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(getISTDateString(d));
    }
    const histories = await streak_history_model_1.StreakHistory.find({
        userId,
        dateString: { $in: days }
    }).lean();
    const activeDates = new Set(histories.map(h => h.dateString));
    return days.map(dateStr => ({
        date: dateStr,
        active: activeDates.has(dateStr)
    }));
}
async function getAdminLeaderboard() {
    const topUsers = await user_model_1.User.find({ 'learningStreak.current': { $gt: 0 } })
        .sort({ 'learningStreak.current': -1 })
        .limit(10)
        .select('name learningStreak.current')
        .lean();
    return topUsers.map(u => ({
        name: u.name,
        currentStreak: u.learningStreak?.current || 0
    }));
}
