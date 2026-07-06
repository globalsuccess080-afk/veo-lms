import api from '../lib/api'
import { User } from '@veolms/shared'

export async function updateProfile(name: string) {
  const { data } = await api.put('/users/me', { name })
  return data.data as User
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.put('/users/me/password', { currentPassword, newPassword })
}
