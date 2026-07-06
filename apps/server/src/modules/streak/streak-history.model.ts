import mongoose, { Schema, Document } from 'mongoose'

export interface IStreakHistory extends Document {
  userId: mongoose.Types.ObjectId
  dateString: string // e.g. "2026-06-20" in IST
  createdAt: Date
}

const streakHistorySchema = new Schema<IStreakHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateString: { type: String, required: true },
  },
  { timestamps: true }
)

// Ensure a user can only have one streak history entry per day
streakHistorySchema.index({ userId: 1, dateString: 1 }, { unique: true })

export const StreakHistory = mongoose.model<IStreakHistory>('StreakHistory', streakHistorySchema)
