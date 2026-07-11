export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`
}

export function formatINR(rupees: number) {
  const amount = Number.isFinite(Number(rupees)) ? Number(rupees) : 0
  const hasFraction = Math.abs(amount % 1) > 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export function parseYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/
  ]
  for (const p of patterns) {
    const match = url.trim().match(p)
    if (match) return match[1]
  }
  return null
}

export function toYouTubeEmbed(url: string): string | null {
  const id = parseYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export function parseMarkdownBasic(text: string): string {
  if (!text) return ''
  let html = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>')
  return html
}
