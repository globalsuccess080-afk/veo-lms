"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByLesson = listByLesson;
exports.createNote = createNote;
exports.deleteNote = deleteNote;
const note_model_1 = require("./note.model");
const apiError_1 = require("../../utils/apiError");
async function listByLesson(userId, lessonId) {
    const notes = await note_model_1.Note.find({ userId, lessonId }).sort({ timestamp: 1 }).lean();
    return notes.map((n) => ({
        id: n._id.toString(),
        content: n.content,
        timestamp: n.timestamp,
        createdAt: n.createdAt.toISOString()
    }));
}
async function createNote(userId, data) {
    const note = await note_model_1.Note.create({ userId, ...data });
    return {
        id: note._id.toString(),
        content: note.content,
        timestamp: note.timestamp,
        createdAt: note.createdAt.toISOString()
    };
}
async function deleteNote(userId, noteId) {
    const note = await note_model_1.Note.findById(noteId);
    if (!note)
        throw new apiError_1.ApiError(404, 'Note not found');
    if (note.userId.toString() !== userId)
        throw new apiError_1.ApiError(403, 'Unauthorized');
    await note.deleteOne();
}
