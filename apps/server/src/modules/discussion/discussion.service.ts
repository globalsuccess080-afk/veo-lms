import { Discussion } from './discussion.model'
import { ApiError } from '../../utils/apiError'
import { formatAssetPath } from '../../utils/assetPath'

interface PopulatedUser {
  _id: { toString(): string }
  name: string
  avatar: string | null
  role: string
}

export async function listByLesson(lessonId: string) {
  const items = await Discussion.find({ lessonId })
    .sort({ createdAt: -1 })
    .populate<{ userId: PopulatedUser }>('userId', 'name avatar role')
    .lean()

  return items.map((d) => ({
    id: d._id.toString(),
    parentId: d.parentId?.toString() || null,
    message: d.message,
    createdAt: d.createdAt.toISOString(),
    author: {
      id: d.userId?._id?.toString() || '',
      name: d.userId?.name || 'User',
      avatar: d.userId?.avatar ? formatAssetPath(d.userId.avatar) : null,
      role: d.userId?.role || 'student'
    }
  }))
}

export async function createMessage(
  userId: string,
  data: { courseId: string; lessonId: string; parentId?: string; message: string }
) {
  const created = await Discussion.create({ userId, ...data })
  const populated = await Discussion.findById(created._id)
    .populate<{ userId: PopulatedUser }>('userId', 'name avatar role')
    .lean()

  return {
    id: populated!._id.toString(),
    parentId: populated!.parentId?.toString() || null,
    message: populated!.message,
    createdAt: populated!.createdAt.toISOString(),
    author: {
      id: populated!.userId?._id?.toString() || '',
      name: populated!.userId?.name || 'User',
      avatar: populated!.userId?.avatar ? formatAssetPath(populated!.userId.avatar) : null,
      role: populated!.userId?.role || 'student'
    }
  }
}

export async function deleteMessage(userId: string, role: string, messageId: string) {
  const msg = await Discussion.findById(messageId)
  if (!msg) throw new ApiError(404, 'Message not found')
  if (msg.userId.toString() !== userId && role !== 'admin') throw new ApiError(403, 'Unauthorized')
  await msg.deleteOne()
  await Discussion.deleteMany({ parentId: messageId }) // cascade delete direct replies
}
