import api from '../lib/api'

export async function getDashboardAnalytics(range: string = '30d') {
    const { data } = await api.get('/analytics/dashboard', { params: { range } })
    return data.data
}
