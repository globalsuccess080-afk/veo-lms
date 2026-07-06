import mongoose, { Schema, Document, Types } from 'mongoose'

export interface INote extends Document {
  userId: Types.ObjectId
  courseId: Types.ObjectId
  lessonId: Types.ObjectId
  content: string
  timestamp: number
  createdAt: Date
  updatedAt: Date
}

const noteSchema = new Schema<INote>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, default: 0 }
}, { timestamps: true })

noteSchema.index({ userId: 1, lessonId: 1, timestamp: 1 })

export const Note = mongoose.model<INote>('Note', noteSchema)
