import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IDiscussion extends Document {
  courseId: Types.ObjectId
  lessonId: Types.ObjectId
  userId: Types.ObjectId
  parentId?: Types.ObjectId | null
  message: string
  createdAt: Date
  updatedAt: Date
}

const discussionSchema = new Schema<IDiscussion>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Discussion', default: null },
  message: { type: String, required: true }
}, { timestamps: true })

discussionSchema.index({ lessonId: 1, createdAt: -1 })

export const Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema)
