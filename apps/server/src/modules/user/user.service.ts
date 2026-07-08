import bcrypt from 'bcryptjs'
import { User } from './user.model'
import { ApiError } from '../../utils/apiError'
import { storageService } from '../../storage/StorageService'
import { formatAssetPath } from '../../utils/assetPath'

export async function updateProfile(userId: string, name: string, avatar?: string | null) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  if (name) user.name = name
  if (avatar !== undefined) {
    if (avatar && user.avatar && avatar !== user.avatar && !user.avatar.startsWith('http')) {
      await storageService.deleteFile(user.avatar).catch(() => {})
    }
    user.avatar = avatar ? storageService.extractKey(avatar) : avatar
  }
  await user.save()
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.getDecryptedEmail(),
    role: user.role,
    avatar: user.avatar ? formatAssetPath(user.avatar) : user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw new ApiError(400, 'Current password is incorrect')
  user.password = await bcrypt.hash(newPassword, 12)
  await user.save()
}
