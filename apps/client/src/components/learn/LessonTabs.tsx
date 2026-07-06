import { useState } from 'react'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MessageSquare, NotebookPen, Paperclip, Send, Trash2, Clock, Download, FileText, FileArchive, File as FileIcon, Info, Keyboard } from 'lucide-react'
import type { LessonResource } from '@veolms/shared'
import { getDiscussion, postMessage, deleteMessage, type DiscussionMessage } from '../../services/discussion.service'
import { getNotes, createNote, deleteNote } from '../../services/note.service'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { cn } from '../../lib/utils'

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['Space', 'K'], action: 'Play / Pause' },
  { keys: ['J', '←'], action: 'Rewind 10 seconds' },
  { keys: ['L', '→'], action: 'Forward 10 seconds' },
  { keys: ['↑'], action: 'Volume up' },
  { keys: ['↓'], action: 'Volume down' },
  { keys: ['M'], action: 'Mute / Unmute' },
  { keys: ['F'], action: 'Toggle fullscreen' },
  { keys: ['P'], action: 'Picture-in-Picture' },
  { keys: ['0', '–', '9'], action: 'Jump to 0%–90%' },
  { keys: ['>'], action: 'Increase speed' },
  { keys: ['<'], action: 'Decrease speed' },
  { keys: ['Home', 'End'], action: 'Go to start / end' }
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid place-items-center min-w-7 h-7 px-2 rounded-md border border-line bg-surface2 text-xs font-semibold text-fg shadow-soft">
      {children}
    </kbd>
  )
}

function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" className="max-w-md">
      <div className="grid gap-2.5">
        {SHORTCUTS.map((s) => (
          <div key={s.action} className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted">{s.action}</span>
            <span className="flex items-center gap-1 shrink-0">
              {s.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

type Tab = 'overview' | 'discussion' | 'notes' | 'resources'

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary grid place-items-center text-xs font-semibold shrink-0">
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function LessonTabs({ courseId, lessonId, description, resources, getCurrentTime, onSeek }: {
  courseId: string
  lessonId: string
  description: string
  resources: LessonResource[]
  getCurrentTime: () => number
  onSeek: (seconds: number) => void
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [showShortcuts, setShowShortcuts] = useState(false)

  const tabs: { id: Tab; label: string; icon: typeof MessageSquare; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'notes', label: 'My Notes', icon: NotebookPen },
    { id: 'resources', label: 'Resources', icon: Paperclip, count: resources.length }
  ]

  return (
    <div className="mt-6">
      <div className="flex items-center mb-5 border-b border-line">
        <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-fg'
              )}
            >
              <t.icon size={16} /> {t.label}
              {typeof t.count === 'number' && t.count > 0 && (
                <span className="text-xs bg-surface2 text-muted rounded-full px-1.5">{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowShortcuts(true)}
          className="flex items-center gap-1.5 px-3 py-2 ml-2 text-xs font-medium text-muted hover:text-fg shrink-0 transition-colors"
          title="Keyboard shortcuts"
        >
          <Keyboard size={16} /> <span className="hidden sm:inline">Shortcuts</span>
        </button>
      </div>

      <div className="min-h-[280px]">
        {tab === 'overview' && (
          description
            ? <div className="text-muted leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: description }} />
            : <EmptyState icon={Info} title="No description" description="This lecture doesn't have a description yet." />
        )}
        {tab === 'discussion' && <DiscussionTab courseId={courseId} lessonId={lessonId} />}
        {tab === 'notes' && <NotesTab courseId={courseId} lessonId={lessonId} getCurrentTime={getCurrentTime} onSeek={onSeek} />}
        {tab === 'resources' && <ResourcesTab resources={resources} />}
      </div>

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}

interface DiscussionNode extends DiscussionMessage {
  children: DiscussionNode[]
}

function buildTree(messages: DiscussionMessage[]): DiscussionNode[] {
  const map = new Map<string, DiscussionNode>()
  const roots: DiscussionNode[] = []

  messages.forEach(m => map.set(m.id, { ...m, children: [] }))
  
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  sorted.forEach(m => {
    const node = map.get(m.id)!
    if (m.parentId && map.has(m.parentId)) {
      map.get(m.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function CommentNode({ 
  node, user, onDelete, onReply 
}: { 
  node: DiscussionNode
  user: any
  onDelete: (id: string) => void
  onReply: (parentId: string, msg: string) => Promise<void>
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')
  const [replying, setReplying] = useState(false)

  const handleReply = async () => {
    if (!replyMsg.trim()) return
    setReplying(true)
    try {
      await onReply(node.id, replyMsg.trim())
      setReplyOpen(false)
      setReplyMsg('')
    } finally {
      setReplying(false)
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar name={node.author.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{node.author.name}</span>
          {node.author.role === 'admin' && <Badge tone="primary" className="text-[10px]">Instructor</Badge>}
          <span className="text-xs text-subtle">{timeAgo(node.createdAt)}</span>
          {(node.author.id === user?.id || user?.role === 'admin') && (
            <button onClick={() => onDelete(node.id)} className="ml-auto text-subtle hover:text-danger transition-colors"><Trash2 size={13} /></button>
          )}
        </div>
        <p className="text-sm text-muted mt-1 whitespace-pre-wrap break-words">{node.message}</p>
        
        <div className="mt-1.5 flex gap-3">
          <button onClick={() => setReplyOpen(!replyOpen)} className="text-xs font-bold text-muted hover:text-fg transition-colors">Reply</button>
        </div>

        {replyOpen && (
          <div className="mt-3 flex gap-3">
            <Avatar name={user?.name || 'U'} />
            <div className="flex-1">
              <Textarea 
                value={replyMsg} 
                onChange={(e) => setReplyMsg(e.target.value)} 
                placeholder="Write a reply..." 
                className="min-h-[60px] text-sm py-2" 
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleReply} loading={replying} disabled={!replyMsg.trim()}>Post Reply</Button>
              </div>
            </div>
          </div>
        )}

        {node.children.length > 0 && (
          <div className="mt-4 space-y-4 border-l-2 border-line/60 pl-3 sm:pl-4">
            {node.children.map(child => (
              <CommentNode 
                key={child.id} 
                node={child} 
                user={user} 
                onDelete={onDelete} 
                onReply={onReply} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DiscussionTab({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const key = ['discussion', lessonId]

  const { data: messages, isLoading } = useQuery({ queryKey: key, queryFn: () => getDiscussion(lessonId) })

  const postMut = useMutation({
    mutationFn: ({ message, parentId }: { message: string; parentId?: string }) => postMessage({ courseId, lessonId, message, parentId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: key }) },
    onError: () => toast.error('Failed to post message')
  })

  const delMut = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  })

  const handlePostReply = async (parentId: string, msg: string) => {
    await postMut.mutateAsync({ message: msg, parentId })
  }

  const handlePostMain = () => {
    if (!message.trim()) return
    postMut.mutate({ message: message.trim() }, {
      onSuccess: () => setMessage('')
    })
  }

  const tree = messages ? buildTree(messages) : []

  return (
    <div>
      <div className="flex gap-3 mb-6 border-b border-line pb-6">
        <Avatar name={user?.name || 'U'} />
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question or share something with the class…"
            className="min-h-[80px]"
          />
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={handlePostMain} loading={postMut.isPending} disabled={!message.trim()}>
              <Send size={15} /> Post
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading discussion…</p>
      ) : tree.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="Be the first to start the conversation." />
      ) : (
        <div className="space-y-6">
          {tree.map((node) => (
            <CommentNode 
              key={node.id} 
              node={node} 
              user={user} 
              onDelete={(id) => delMut.mutate(id)} 
              onReply={handlePostReply} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotesTab({ courseId, lessonId, getCurrentTime, onSeek }: {
  courseId: string
  lessonId: string
  getCurrentTime: () => number
  onSeek: (seconds: number) => void
}) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const key = ['notes', lessonId]

  const { data: notes, isLoading } = useQuery({ queryKey: key, queryFn: () => getNotes(lessonId) })

  const addMut = useMutation({
    mutationFn: () => createNote({ courseId, lessonId, content: content.trim(), timestamp: Math.floor(getCurrentTime()) }),
    onSuccess: () => { setContent(''); queryClient.invalidateQueries({ queryKey: key }) },
    onError: () => toast.error('Failed to save note')
  })

  const delMut = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  })

  return (
    <div>
      <div className="mb-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a note — it'll be saved with the current video timestamp…"
          className="min-h-20"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-subtle flex items-center gap-1">
            <Clock size={12} /> Will be saved at {clock(getCurrentTime())}
          </span>
          <Button size="sm" onClick={() => content.trim() && addMut.mutate()} loading={addMut.isPending} disabled={!content.trim()}>
            <NotebookPen size={15} /> Save note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading notes…</p>
      ) : !notes || notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" description="Jot down key points and jump back to them anytime." />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-input border border-line p-3 bg-surface">
              <button
                onClick={() => onSeek(n.timestamp)}
                className="text-xs font-medium text-primary bg-primary-subtle rounded px-2 py-1 shrink-0 hover:opacity-80 transition-opacity tabular-nums"
                title="Jump to this point"
              >
                {clock(n.timestamp)}
              </button>
              <p className="text-sm text-fg flex-1 whitespace-pre-wrap break-words">{n.content}</p>
              <button onClick={() => delMut.mutate(n.id)} className="text-subtle hover:text-danger transition-colors shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function resourceIcon(type?: string, url?: string) {
  const v = `${type || ''} ${url || ''}`.toLowerCase()
  if (v.includes('zip') || v.includes('rar') || v.includes('compressed')) return FileArchive
  if (v.includes('pdf') || v.includes('text') || v.includes('doc')) return FileText
  return FileIcon
}

function ResourcesTab({ resources }: { resources: LessonResource[] }) {
  const [downloading, setDownloading] = useState<Record<string, number>>({})

  if (!resources || resources.length === 0) {
    return <EmptyState icon={Paperclip} title="No resources" description="The instructor hasn't attached any downloadable resources to this lecture." />
  }

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>, url: string, filename: string) => {
    e.preventDefault()
    if (downloading[url]) return // prevent multiple clicks
    try {
      setDownloading(prev => ({ ...prev, [url]: 1 }))
      const response = await axios.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setDownloading(prev => ({ ...prev, [url]: pct }))
          }
        }
      })
      const blob = new Blob([response.data])
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(url, '_blank') // Fallback if fetch fails (e.g. CORS)
    } finally {
      setDownloading(prev => {
        const next = { ...prev }
        delete next[url]
        return next
      })
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {resources.map((r, i) => {
        const Icon = resourceIcon(r.type, r.url)
        const pct = downloading[r.url]
        return (
          <a
            key={i}
            href={r.url}
            onClick={(e) => handleDownload(e, r.url, r.title)}
            className="flex items-center gap-3 rounded-input border border-line p-3 bg-surface hover:border-primary hover:bg-surface2/50 transition-colors group relative overflow-hidden"
          >
            {pct !== undefined && (
              <div className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-300" style={{ width: `${pct}%` }} />
            )}
            <span className="w-9 h-9 rounded-lg bg-primary-subtle grid place-items-center text-primary shrink-0 relative z-10"><Icon size={18} /></span>
            <div className="min-w-0 flex-1 relative z-10">
              <p className="text-sm font-medium truncate">{r.title}</p>
              {r.size ? <p className="text-xs text-subtle">{formatBytes(r.size)}</p> : null}
            </div>
            <div className="relative z-10 shrink-0">
              {pct !== undefined ? (
                <span className="text-[11px] font-bold text-primary mr-1">{pct}%</span>
              ) : (
                <Download size={16} className="text-muted group-hover:text-primary transition-colors" />
              )}
            </div>
          </a>
        )
      })}
    </div>
  )
}
