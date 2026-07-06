import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Megaphone, Send, Bell, Copy, Trash2, Calendar, LayoutList, Mail, Plus, Bold, Italic, Link2, List } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ColumnDef } from '@tanstack/react-table'

import { createAnnouncement, getAnnouncements, deleteAnnouncement, duplicateAnnouncement } from '../../services/admin.service'
import { getAdminCourses } from '../../services/course.service'
import { AdminPage } from '../../components/admin/AdminPage'
import { Card } from '../../components/ui/Card'
import { Input, Field } from '../../components/ui/Input'
import { Dropdown } from '../../components/ui/Dropdown'
import { Checkbox } from '../../components/ui/Checkbox'
import { AppDatePicker } from '../../components/ui/app-datepicker'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { parseMarkdownBasic } from '../../lib/utils'

import { useTableState } from '../../components/admin/table/useTableState'
import { DataTable } from '../../components/admin/table/DataTable'
import { TableSearch } from '../../components/admin/table/TableSearch'
import { TablePagination } from '../../components/admin/table/TablePagination'
import { FilterChipList } from '../../components/admin/table/FilterChipList'
import { TableFilters } from '../../components/admin/table/TableFilters'
import { AnnouncementsSkeleton } from '../../components/skeletons/admin/AnnouncementsSkeleton'
import { useAlertStore } from '../../store/alertStore'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const {
    pagination, setPagination,
    sorting, setSorting,
    search, setSearch,
    filters, setFilter, removeFilter, clearFilters,
    searchParams
  } = useTableState()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const showAlert = useAlertStore(s => s.showAlert)

  // Form State
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audienceType, setAudienceType] = useState<'all' | 'course'>('all')
  const [courseId, setCourseId] = useState('')
  const [type, setType] = useState('General')
  const [priority, setPriority] = useState('Normal')
  const [inApp, setInApp] = useState(true)
  const [email, setEmail] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [actionLabel, setActionLabel] = useState('')
  const [actionUrl, setActionUrl] = useState('')

  const { data: courses } = useQuery({ queryKey: ['admin-courses'], queryFn: () => getAdminCourses() })

  const queryParams = Object.fromEntries(searchParams.entries())
  const { data: history, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['announcements', queryParams],
    queryFn: () => getAnnouncements(queryParams),
    placeholderData: (prev) => prev
  })

  const announcements = history?.announcements || []
  const meta = history?.meta || { total: 0, totalPages: 0 }

  const createMut = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      toast.success('Announcement created successfully')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setIsModalOpen(false)
      setTitle(''); setMessage(''); setActionLabel(''); setActionUrl(''); setScheduledAt(''); setIsScheduled(false);
    },
    onError: () => toast.error('Failed to create announcement')
  })

  const delMut = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      toast.success('Announcement deleted')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    }
  })

  const dupMut = useMutation({
    mutationFn: duplicateAnnouncement,
    onSuccess: (data: any) => {
      toast.success('Announcement duplicated')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setTitle(data.title)
      setMessage(data.message)
      setAudienceType(data.audience?.type || 'all')
      setCourseId(data.audience?.courseId || '')
      setType(data.type)
      setPriority(data.priority)
      setInApp(data.deliveryChannels?.inApp ?? true)
      setEmail(data.deliveryChannels?.email ?? false)
      setActionLabel(data.actionLabel || '')
      setActionUrl(data.actionUrl || '')
      setIsScheduled(false)
      setScheduledAt('')
      setIsModalOpen(true)
    }
  })

  const handleSend = () => {
    if (!title || !message) return toast.error('Title and message are required')
    if (audienceType === 'course' && !courseId) return toast.error('Select a course')
    if (isScheduled && !scheduledAt) return toast.error('Select a schedule date/time')

    createMut.mutate({
      title,
      message,
      audience: { type: audienceType, courseId: courseId || undefined },
      type,
      priority,
      deliveryChannels: { inApp, email },
      actionLabel: actionLabel || undefined,
      actionUrl: actionUrl || undefined,
      scheduledAt: isScheduled ? new Date(scheduledAt).toISOString() : undefined
    })
  }

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const selection = text.substring(start, end)
    const after = text.substring(end, text.length)

    setMessage(before + prefix + (selection || 'text') + suffix + after)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection || 'text').length)
    }, 0)
  }

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Title & Type',
      cell: ({ row }) => {
        const a = row.original
        return (
          <div>
            <p className="font-bold text-fg truncate max-w-[200px]">{a.title}</p>
            <p className="text-[11px] text-muted">{a.type} • {a.priority}</p>
          </div>
        )
      }
    },
    {
      id: 'audience',
      header: 'Audience',
      cell: ({ row }) => {
        const type = row.original.audience?.type || 'all'
        return <span className="px-2 py-1 bg-surface2 text-muted rounded text-[11px] font-medium capitalize">{type}</span>
      },
      enableSorting: false
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const color = status === 'sent' ? 'success' : status === 'scheduled' ? 'warning' : status === 'failed' ? 'danger' : 'primary'
        return <Badge tone={color} className="font-bold px-2.5 py-1 uppercase">{status}</Badge>
      }
    },
    {
      id: 'opens',
      header: 'Opens',
      cell: ({ row }) => {
        const stats = row.original.stats || { opened: 0, sentTo: 0 }
        return <p className="font-medium">{stats.opened} <span className="text-muted text-[11px]">/ {stats.sentTo}</span></p>
      },
      enableSorting: false
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => dupMut.mutate(a.id)} className="p-2 rounded-lg text-muted hover:bg-surface hover:text-primary transition-all shadow-sm border border-transparent hover:border-line" title="Duplicate"><Copy size={16} strokeWidth={2.5} /></button>
            <button onClick={() => {
              showAlert({
                title: 'Delete Announcement',
                message: 'Are you sure you want to delete this announcement?',
                danger: true,
                confirmText: 'Delete',
                onConfirm: () => delMut.mutate(a.id)
              })
            }} className="p-2 rounded-lg text-muted hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition-all shadow-sm border border-transparent" title="Delete"><Trash2 size={16} strokeWidth={2.5} /></button>
          </div>
        )
      }
    }
  ], [dupMut, delMut])

  if (isLoading && !announcements.length) {
    return <AnnouncementsSkeleton />
  }

  return (
    <AdminPage
      title="Announcements"
      subtitle="Broadcast messages, updates, and offers to your students"
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="font-bold shadow-soft">
          <Plus size={18} strokeWidth={2.5} className="mr-1.5" /> New Announcement
        </Button>
      }
    >
      <motion.div initial="hidden" animate="show" variants={containerVars}>
        <motion.div variants={itemVars}>
          <Card className="p-6 border-line/80 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <TableSearch initialValue={search} onSearch={setSearch} placeholder="Search announcements..." />

              <TableFilters>
                <div className="w-40">
                  <Dropdown
                    value={filters.status || ''}
                    onChange={(val) => setFilter('status', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'sent', label: 'Sent' },
                    ]}
                    placeholder="Status"
                  />
                </div>
                <div className="w-40">
                  <Dropdown
                    value={filters.type || ''}
                    onChange={(val) => setFilter('type', val === 'all' ? null : val)}
                    options={[
                      { value: 'all', label: 'All Types' },
                      ...['General', 'Course Update', 'New Lesson', 'Assignment', 'Offer'].map(t => ({ value: t, label: t }))
                    ]}
                    placeholder="Type"
                  />
                </div>
              </TableFilters>
            </div>

            <FilterChipList filters={filters} onRemove={removeFilter} onClearAll={clearFilters} />
          </Card>

          <DataTable
            columns={columns}
            data={announcements}
            pageCount={meta.totalPages}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            isLoading={isLoading || isPlaceholderData}
          />

          {announcements.length > 0 && (
            <TablePagination
              pagination={pagination}
              setPagination={setPagination}
              totalCount={meta.total}
              totalPages={meta.totalPages}
            />
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 w-full lg:w-2/3 xl:w-[800px] h-full bg-surface shadow-2xl border-l border-line/80 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-line/80 bg-surface2/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-fg flex items-center gap-2"><Megaphone size={18} className="text-primary"/> Create Announcement</h2>
                  <p className="text-sm text-muted">Broadcast messages to your students</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted hover:bg-surface hover:text-fg transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-8">
                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Audience">
                        <Dropdown
                          value={audienceType}
                          onChange={(v: any) => setAudienceType(v)}
                          options={[
                            { value: 'all', label: 'All Students' },
                            { value: 'course', label: 'Specific Course Students' }
                          ]}
                        />
                      </Field>

                      {audienceType === 'course' && (
                        <Field label="Select Course">
                          <Dropdown
                            value={courseId}
                            onChange={setCourseId}
                            options={courses?.courses?.map(c => ({ value: c.id, label: c.title })) || []}
                            placeholder="-- Choose Course --"
                          />
                        </Field>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Type">
                        <Dropdown
                          value={type}
                          onChange={setType}
                          options={['General', 'Course Update', 'New Lesson', 'Assignment', 'Offer', 'Maintenance', 'Important'].map(t => ({ value: t, label: t }))}
                        />
                      </Field>
                      <Field label="Priority">
                        <Dropdown
                          value={priority}
                          onChange={setPriority}
                          options={['Low', 'Normal', 'High', 'Urgent'].map(p => ({ value: p, label: p }))}
                        />
                      </Field>
                    </div>

                    <Field label="Title">
                      <Input className="h-11 bg-canvas hover:border-line-strong transition-all" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New React Module Released!" />
                    </Field>

                    <Field label="Message">
                      <div className="border border-line rounded-[var(--rad-btn)] overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <div className="bg-surface border-b border-line px-2 py-1.5 flex gap-1">
                          <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded hover:bg-canvas text-muted hover:text-fg" title="Bold"><Bold size={14}/></button>
                          <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded hover:bg-canvas text-muted hover:text-fg" title="Italic"><Italic size={14}/></button>
                          <button onClick={() => insertMarkdown('[', '](https://)')} className="p-1.5 rounded hover:bg-canvas text-muted hover:text-fg" title="Link"><Link2 size={14}/></button>
                          <button onClick={() => insertMarkdown('- ')} className="p-1.5 rounded hover:bg-canvas text-muted hover:text-fg" title="List"><List size={14}/></button>
                        </div>
                        <textarea
                          id="message-textarea"
                          className="w-full min-h-[140px] p-3 bg-canvas outline-none text-sm resize-y"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Supports basic markdown like **bold**, *italic*, and [links](url)..."
                        />
                      </div>
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[13px] font-bold text-fg mb-3 flex items-center gap-1.5"><LayoutList size={14}/> Call to Action</p>
                        <div className="space-y-3">
                          <Input className="h-9 text-sm" placeholder="Button Label" value={actionLabel} onChange={e => setActionLabel(e.target.value)} />
                          <Input className="h-9 text-sm" placeholder="Button URL" value={actionUrl} onChange={e => setActionUrl(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-fg mb-3 flex items-center gap-1.5"><Calendar size={14}/> Schedule & Delivery</p>
                        <div className="space-y-3">
                          <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={inApp} onCheckedChange={setInApp} /> In-App</label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={email} onCheckedChange={setEmail} /> Email</label>
                          </div>
                          <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                            <Checkbox checked={isScheduled} onCheckedChange={checked => {
                              setIsScheduled(checked)
                              if (checked && !scheduledAt) {
                                const date = new Date()
                                date.setHours(date.getHours() + 1)
                                setScheduledAt(format(date, "yyyy-MM-dd'T'HH:mm"))
                              }
                            }} /> Schedule later
                          </label>
                          {isScheduled && (
                            <AppDatePicker type="datetime-local" value={scheduledAt} onChange={setScheduledAt} minDate={format(new Date(), 'yyyy-MM-dd')} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-line/50 pt-8">
                    <p className="text-[13px] font-bold text-fg mb-3 flex items-center gap-1.5"><Bell size={14} className="text-primary" /> Live Preview</p>
                    <div className="rounded-xl border border-line bg-canvas p-4 shadow-sm relative overflow-hidden mb-4">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone size={14} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[14px] font-bold text-fg truncate">{title || 'Announcement title'}</p>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">Just now</span>
                          </div>
                          <div
                            className="text-[13px] text-fg/90 leading-relaxed break-words markdown-content"
                            dangerouslySetInnerHTML={{ __html: parseMarkdownBasic(message) || 'Your message will appear here.' }}
                          />
                          {actionLabel && (
                            <div className="mt-3">
                              <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-[12px] font-bold rounded-[var(--rad-btn)]">
                                {actionLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] font-bold text-fg mb-3 flex items-center gap-1.5 mt-6"><Mail size={14} className="text-primary"/> Email Preview</p>
                    <div className="rounded-xl border border-line bg-canvas p-4 shadow-sm">
                      <p className="text-[14px] font-bold text-fg truncate">
                        VeoLMS: {title || 'Announcement title'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-line/80 bg-surface2/50 flex items-center justify-end gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold">
                  Cancel
                </Button>
                <Button onClick={handleSend} loading={createMut.isPending} disabled={!title || !message} className="font-bold shadow-soft">
                  <Send size={16} strokeWidth={2.5} className="mr-2" /> {isScheduled ? 'Schedule' : 'Send'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminPage>
  )
}
