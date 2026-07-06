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
  return `₹${rupees.toLocaleString('en-IN')}`
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
    // Escaped characters (prevent XSS basic)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Lists
    .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>')
  return html
}
