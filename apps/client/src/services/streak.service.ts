import api from '../lib/api'

export interface StreakStats {
  current: number
  longest: number
  activeDays: number
}

export interface StreakDay {
  date: string
  active: boolean
}

export async function getMyStreak(): Promise<StreakStats> {
  const { data } = await api.get('/streak/me')
  return data.data
}

export async function getStreakHistory(): Promise<StreakDay[]> {
  const { data } = await api.get('/streak/history')
  return data.data
}

export async function getAdminStreakLeaderboard(): Promise<{name: string, currentStreak: number}[]> {
  const { data } = await api.get('/streak/admin/leaderboard')
  return data.data
}
