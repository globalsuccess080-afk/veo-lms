import { Note } from './note.model'
import { ApiError } from '../../utils/apiError'

export async function listByLesson(userId: string, lessonId: string) {
  const notes = await Note.find({ userId, lessonId }).sort({ timestamp: 1 }).lean()
  return notes.map((n) => ({
    id: n._id.toString(),
    content: n.content,
    timestamp: n.timestamp,
    createdAt: n.createdAt.toISOString()
  }))
}

export async function createNote(
  userId: string,
  data: { courseId: string; lessonId: string; content: string; timestamp: number }
) {
  const note = await Note.create({ userId, ...data })
  return {
    id: note._id.toString(),
    content: note.content,
    timestamp: note.timestamp,
    createdAt: note.createdAt.toISOString()
  }
}

export async function deleteNote(userId: string, noteId: string) {
  const note = await Note.findById(noteId)
  if (!note) throw new ApiError(404, 'Note not found')
  if (note.userId.toString() !== userId) throw new ApiError(403, 'Unauthorized')
  await note.deleteOne()
}
