import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Youtube, Upload, UploadCloud, GripVertical, Clock, Eye, Pencil, Paperclip, FileText, Loader2, Save, BookOpen, Layers } from 'lucide-react'
import { getAdminCourse, createCourse, updateCourse, addSection, updateSection, deleteSection, reorderSections, getCategories } from '../../services/course.service'
import { getLessons, createLesson, updateLesson, deleteLesson } from '../../services/lesson.service'
import { uploadResource, uploadVideo } from '../../services/video.service'
import { useProcessingStore } from '../../store/processingStore'
import type { Lesson, LessonResource } from '@veolms/shared'
import { AdminPage } from '../../components/admin/AdminPage'
import { VideoUpload } from '../../components/admin/VideoUpload'
import { ImageUpload } from '../../components/admin/ImageUpload'
import { CourseEditorSkeleton } from '../../components/skeletons/admin/CourseEditorSkeleton'
import { Card } from '../../components/ui/Card'
import { Input, Textarea, Field, Label } from '../../components/ui/Input'
import { AppSelect } from '../../components/ui/app-select'
import { RichTextEditor } from '../../components/ui/RichTextEditor'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { cn, formatDuration, toYouTubeEmbed } from '../../lib/utils'
import { useAlertStore } from '../../store/alertStore'

const LEVEL_OPTIONS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
]

type VideoSource = 'youtube' | 'upload'
const emptyLesson = { title: '', description: '', source: 'upload' as VideoSource, youtubeUrl: '', fileUrl: '', duration: 0, isPreview: false, pendingFile: null as File | null }
type DraftUploadState = { pct: number; stage: string; fileName: string } | null
type CourseFormErrors = Partial<Record<'title' | 'category' | 'shortDescription' | 'description' | 'price' | 'originalPrice' | 'instructorName', string>>

const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVars: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function CategoryCombobox({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: string[], placeholder: string }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Input 
                    className="h-12 bg-canvas hover:border-line-strong transition-all pr-10" 
                    value={value} 
                    onChange={(e) => {
                        onChange(e.target.value)
                        setSearch(e.target.value)
                        setOpen(true)
                    }} 
                    onFocus={() => {
                        setSearch(value)
                        setOpen(true)
                    }}
                    placeholder={placeholder}
                />
                <button 
                    type="button" 
                    onClick={() => {
                        if (!open) setSearch(value)
                        setOpen(!open)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1 rounded-md hover:bg-surface transition-colors"
                >
                    <ChevronDown size={16} />
                </button>
            </div>
            
            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-[var(--surface)] border border-[var(--border-default)] rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                    >
                        {filtered.length === 0 ? (
                            <div className="p-3 text-sm text-[var(--text-muted)] text-center">
                                {search ? `Press enter to use "${search}"` : "Start typing to create a category"}
                            </div>
                        ) : (
                            <div className="py-1">
                                {filtered.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--primary)] transition-colors border-b border-[var(--border-default)] last:border-0"
                                        onClick={() => {
                                            onChange(opt)
                                            setOpen(false)
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function plainText(value: string) {
    return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function validateCourseForm(form: {
    title: string
    description: string
    shortDescription: string
    instructorName: string
    price: number
    originalPrice: number
    category: string
}) {
    const errors: CourseFormErrors = {}

    if (form.title.trim().length < 3) {
        errors.title = 'Enter a course title with at least 3 characters.'
    }
    if (form.category.trim().length < 2) {
        errors.category = 'Select or enter a category.'
    }
    const shortDescription = form.shortDescription.trim()
    if (shortDescription.length < 10) {
        errors.shortDescription = 'Add a short description with at least 10 characters.'
    } else if (shortDescription.length > 300) {
        errors.shortDescription = 'Short description must be 300 characters or less.'
    }
    if (plainText(form.description).length < 10) {
        errors.description = 'Add a full description with at least 10 characters.'
    }
    if (form.instructorName.trim().length < 2) {
        errors.instructorName = 'Enter the instructor name.'
    }
    if (!Number.isFinite(form.price) || form.price < 0) {
        errors.price = 'Enter a valid course price.'
    }
    if (!Number.isFinite(form.originalPrice) || form.originalPrice < 0) {
        errors.originalPrice = 'Enter a valid original price.'
    }

    return errors
}


export function CourseEditorPage() {
    const { id } = useParams()
    const isNew = !id || id === 'new'
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [openSections, setOpenSections] = useState<string[]>([])
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
    const [editingSectionTitle, setEditingSectionTitle] = useState('')
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
    const showAlert = useAlertStore(s => s.showAlert)
    const allJobs = useProcessingStore(s => s.jobs)
    const courseJobs = allJobs.filter(j => j.courseId === id)

    const [form, setForm] = useState({
        title: '', description: '', shortDescription: '', thumbnail: '', trailerUrl: '',
        instructorName: 'VeoLMS Instructor', price: 499, originalPrice: 999,
        category: 'JavaScript', level: 'beginner', isFeatured: false, isPublished: false
    })
    const [formErrors, setFormErrors] = useState<CourseFormErrors>({})

    const [newSection, setNewSection] = useState('')
    const [lessonForm, setLessonForm] = useState(emptyLesson)
    const [adding, setAdding] = useState(false)
    const [draftUpload, setDraftUpload] = useState<DraftUploadState>(null)
    const draftUploadFallbackTimer = useRef<ReturnType<typeof setInterval> | null>(null)

    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null)
    const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null)

    const reorderSectionsMut = useMutation({
        mutationFn: (sectionIds: string[]) => reorderSections(id!, sectionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-course', id] })
            toast.success('Sections reordered')
        }
    })

    const handleDragStart = (e: React.DragEvent, sid: string) => {
        setDraggedSectionId(sid)
        e.dataTransfer.effectAllowed = 'move'
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.5'
            }
        }, 0)
    }

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedSectionId(null)
        setDragOverSectionId(null)
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '1'
        }
    }

    const handleDragOver = (e: React.DragEvent, sid: string) => {
        e.preventDefault()
        if (dragOverSectionId !== sid) {
            setDragOverSectionId(sid)
        }
    }

    const handleDrop = (e: React.DragEvent, sid: string) => {
        e.preventDefault()
        setDragOverSectionId(null)

        if (!draggedSectionId || draggedSectionId === sid || !course) return

        const newSections = [...course.sections]
        const draggedIndex = newSections.findIndex(s => s._id === draggedSectionId)
        const dropIndex = newSections.findIndex(s => s._id === sid)

        if (draggedIndex === -1 || dropIndex === -1) return

        const [draggedItem] = newSections.splice(draggedIndex, 1)
        newSections.splice(dropIndex, 0, draggedItem)

        queryClient.setQueryData(['admin-course', id], { ...course, sections: newSections })
        reorderSectionsMut.mutate(newSections.map(s => s._id))
        setDraggedSectionId(null)
    }

    const { data: course, isLoading: isCourseLoading } = useQuery({ queryKey: ['admin-course', id], queryFn: () => getAdminCourse(id!), enabled: !isNew })
    const { data: lessons, isLoading: isLessonsLoading } = useQuery({ queryKey: ['lessons', id], queryFn: () => getLessons(id!), enabled: !isNew })
    const { data: dbCategories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
    
    const categories = Array.from(new Set([...dbCategories])).sort()

    const isLoading = !isNew && (isCourseLoading || isLessonsLoading)

    useEffect(() => {
        if (course) {
            setForm({
                title: course.title, description: course.description, shortDescription: course.shortDescription,
                thumbnail: course.thumbnail, trailerUrl: course.trailerUrl, instructorName: course.instructor.name,
                price: course.price, originalPrice: course.originalPrice, category: course.category,
                level: course.level, isFeatured: course.isFeatured, isPublished: course.isPublished
            })
            setOpenSections(course.sections.map((s) => s._id))
        }
    }, [course])

    const saveMut = useMutation({
        mutationFn: () => {
            const body = {
                title: form.title.trim(), description: form.description, shortDescription: form.shortDescription.trim(),
                thumbnail: form.thumbnail, trailerUrl: form.trailerUrl,
                instructor: { name: form.instructorName.trim(), bio: '', avatar: '' },
                price: form.price, originalPrice: form.originalPrice, category: form.category.trim(),
                level: form.level, isFeatured: form.isFeatured, isPublished: form.isPublished
            }
            return isNew ? createCourse(body) : updateCourse(id!, body)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
            toast.success(isNew ? 'Course created — now add your curriculum' : 'Course saved')
            if (isNew) navigate(`/admin/courses/${data.id}/edit`)
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Could not save the course. Please check the form and try again.')
    })

    const addSectionMut = useMutation({
        mutationFn: () => addSection(id!, newSection, course?.sections.length || 0),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-course', id] }); setNewSection(''); toast.success('Section added') }
    })

    const deleteSectionMut = useMutation({
        mutationFn: (sectionId: string) => deleteSection(id!, sectionId),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-course', id] }); toast.success('Section deleted') }
    })

    const updateSectionMut = useMutation({
        mutationFn: ({ sectionId, title }: { sectionId: string, title: string }) => updateSection(id!, sectionId, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-course', id] })
            setEditingSectionId(null)
            toast.success('Section updated')
        }
    })

    const deleteLessonMut = useMutation({
        mutationFn: deleteLesson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessons', id] })
            queryClient.invalidateQueries({ queryKey: ['admin-course', id] })
            toast.success('Lecture deleted')
        }
    })

    const stopDraftUploadFallback = () => {
        if (draftUploadFallbackTimer.current) {
            clearInterval(draftUploadFallbackTimer.current)
            draftUploadFallbackTimer.current = null
        }
    }

    const startDraftUploadFallback = () => {
        stopDraftUploadFallback()
        draftUploadFallbackTimer.current = setInterval(() => {
            setDraftUpload((current) => {
                if (!current || current.pct >= 92) return current
                return {
                    ...current,
                    pct: Math.min(92, current.pct + (current.pct < 40 ? 3 : 1)),
                }
            })
        }, 900)
    }

    useEffect(() => () => stopDraftUploadFallback(), [])

    const resetLessonForm = () => {
        stopDraftUploadFallback()
        setDraftUpload(null)
        setLessonForm(emptyLesson)
    }

    const handleAddLesson = async (sectionId: string) => {
        if (!lessonForm.title) return toast.error('Add a lecture title')
        const pendingFile = lessonForm.source === 'upload' ? lessonForm.pendingFile : null

        let youtubeUrl = ''
        if (lessonForm.source === 'youtube') {
            const embed = toYouTubeEmbed(lessonForm.youtubeUrl)
            if (!embed) return toast.error('Enter a valid YouTube link, e.g. https://www.youtube.com/embed/VIDEO_ID')
            youtubeUrl = embed
        }

        setAdding(true)
        if (pendingFile) {
            setDraftUpload({ pct: 1, stage: 'Preparing upload...', fileName: pendingFile.name })
            startDraftUploadFallback()
        }

        try {
            const createdLesson = await createLesson(id!, sectionId, {
                title: lessonForm.title,
                description: lessonForm.description,
                youtubeUrl,
                fileUrl: '',
                duration: lessonForm.duration,
                isPreview: lessonForm.isPreview,
                order: 0
            })

            if (pendingFile) {
                setDraftUpload({ pct: 1, stage: 'Uploading video...', fileName: pendingFile.name })
                const uploadResult = await uploadVideo(pendingFile, createdLesson.id, (pct) => {
                    setDraftUpload({
                        pct: Math.max(1, Math.min(99, pct)),
                        stage: 'Uploading video...',
                        fileName: pendingFile.name,
                    })
                })
                stopDraftUploadFallback()
                setDraftUpload({ pct: 100, stage: 'Upload complete. Starting processing...', fileName: pendingFile.name })
                useProcessingStore.getState().addJob({
                    lessonId: createdLesson.id,
                    courseId: course?.id || id!,
                    courseTitle: course?.title || form.title || 'Untitled course',
                    lessonTitle: lessonForm.title,
                    jobId: uploadResult.jobId,
                })
            }

            queryClient.invalidateQueries({ queryKey: ['admin-course', id] })
            queryClient.invalidateQueries({ queryKey: ['lessons', id] })
            resetLessonForm()
            toast.success('Lecture added')
        } catch (err: any) {
            stopDraftUploadFallback()
            setDraftUpload(null)
            toast.error(err.response?.data?.message || 'Failed to add lecture')
        } finally {
            setAdding(false)
        }
    }

    const toggleSection = (sid: string) =>
        setOpenSections((prev) => (prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid]))

    const set = (field: string, value: string | number | boolean) => {
        setForm((p) => ({ ...p, [field]: value }))
        if (field in formErrors) {
            setFormErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    const handleSaveCourse = () => {
        const errors = validateCourseForm(form)
        setFormErrors(errors)

        if (Object.keys(errors).length > 0) {
            toast.error('Please fix the highlighted fields before saving.')
            return
        }

        saveMut.mutate()
    }

    if (isLoading) {
        return <CourseEditorSkeleton />
    }

    return (
        <AdminPage
            title={isNew ? 'Create Course' : 'Edit Course'}
            subtitle={isNew ? 'Add a new course to your catalog' : form.title}
            actions={
                <div className="flex items-center gap-3">
                    <Link to="/admin/courses" className="text-[13px] font-bold text-muted hover:text-fg flex items-center gap-1 transition-colors"><ArrowLeft size={16} /> Back</Link>
                    <Button onClick={handleSaveCourse} loading={saveMut.isPending} className="font-bold shadow-soft">
                        <Save size={16} className="mr-1.5" /> {isNew ? 'Create Course' : 'Save Changes'}
                    </Button>
                </div>
            }
        >
            <motion.div initial="hidden" animate="show" variants={containerVars}>
                <motion.div variants={itemVars}>
                    <Card className="p-6 lg:p-8 mb-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                        <div className="flex items-center gap-2.5 mb-6 text-[15px] font-bold text-fg uppercase tracking-wide border-b border-line/80 pb-3">
                            <BookOpen size={18} className="text-primary" /> Course Details
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Field label="Title" error={formErrors.title}><Input error={formErrors.title} className="h-12 bg-canvas hover:border-line-strong transition-all" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Next.js for Beginners" /></Field>
                            <Field label="Category" error={formErrors.category}>
                                <CategoryCombobox
                                    value={form.category}
                                    onChange={(val) => set('category', val)}
                                    options={categories}
                                    placeholder="Type or select a category"
                                />
                            </Field>
                        </div>

                        <div className="mt-6">
                            <Field label="Short description" error={formErrors.shortDescription}><Input error={formErrors.shortDescription} className="h-12 bg-canvas hover:border-line-strong transition-all" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} placeholder="One-line summary shown on cards" /></Field>
                        </div>

                        <div className="mt-6">
                            <Field label="Full description" error={formErrors.description}><RichTextEditor className="placeholder:opacity-60" value={form.description} onChange={(val) => set('description', val)} placeholder="What students will learn, prerequisites, etc." /></Field>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <Field label="Thumbnail"><ImageUpload value={form.thumbnail} onChange={(v) => set('thumbnail', v)} /></Field>
                            <Field label="Trailer (YouTube embed URL)"><Input className="h-12 bg-canvas hover:border-line-strong transition-all" value={form.trailerUrl} onChange={(e) => set('trailerUrl', e.target.value)} placeholder="https://www.youtube.com/embed/..." /></Field>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                            <Field label="Price (₹)" error={formErrors.price}><Input error={formErrors.price} className="h-12 bg-canvas hover:border-line-strong transition-all" type="number" value={form.price} onChange={(e) => set('price', +e.target.value)} /></Field>
                            <Field label="Original price (₹)" error={formErrors.originalPrice}><Input error={formErrors.originalPrice} className="h-12 bg-canvas hover:border-line-strong transition-all" type="number" value={form.originalPrice} onChange={(e) => set('originalPrice', +e.target.value)} /></Field>
                            <Field label="Level"><AppSelect value={form.level} options={LEVEL_OPTIONS} onChange={(v) => set('level', v)} /></Field>
                            <Field label="Instructor" error={formErrors.instructorName}><Input error={formErrors.instructorName} className="h-12 bg-canvas hover:border-line-strong transition-all" value={form.instructorName} onChange={(e) => set('instructorName', e.target.value)} /></Field>
                        </div>

                        <div className="flex gap-8 mt-8 p-4 rounded-xl bg-surface2/50 border border-line/80">
                            <label className="flex items-center gap-3 text-[14px] font-bold cursor-pointer group">
                                <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors", form.isFeatured ? "bg-primary border-primary" : "border-line-strong group-hover:border-primary")}>
                                    {form.isFeatured && <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <input type="checkbox" className="hidden" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured Course
                            </label>
                            <label className="flex items-center gap-3 text-[14px] font-bold cursor-pointer group">
                                <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors", form.isPublished ? "bg-primary border-primary" : "border-line-strong group-hover:border-primary")}>
                                    {form.isPublished && <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <input type="checkbox" className="hidden" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} /> Published
                            </label>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVars}>
                    {isNew ? (
                        <Card className="p-12 text-center border-line/80 shadow-sm bg-surface/50">
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={28} strokeWidth={2.5} />
                            </div>
                            <p className="text-[15px] font-bold text-fg mb-2">Almost there!</p>
                            <p className="text-[14px] text-muted max-w-sm mx-auto">Save the course first to unlock the curriculum builder and start adding your lectures.</p>
                        </Card>
                    ) : course && (
                        <Card className="p-6 lg:p-8 border-line/80 shadow-sm bg-surface/50 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5 text-[15px] font-bold text-fg uppercase tracking-wide">
                                    <Layers size={18} className="text-primary" /> Curriculum
                                </div>
                                <Badge tone="primary" className="font-bold">{course.sections.length} sections · {lessons?.length || 0} lectures</Badge>
                            </div>
                            <p className="text-[14px] text-muted mb-8 font-medium border-b border-line/80 pb-4">Organize your course into sections, then add lectures with video.</p>

                            <div className="flex gap-3 mb-8">
                                <Input className="h-12 bg-canvas hover:border-line-strong transition-all" placeholder="New section title (e.g. Getting Started)" value={newSection} onChange={(e) => setNewSection(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && newSection && addSectionMut.mutate()} />
                                <Button className="h-12 px-6 font-bold shadow-soft shrink-0" onClick={() => newSection && addSectionMut.mutate()} disabled={!newSection} loading={addSectionMut.isPending}><Plus size={18} strokeWidth={2.5} className="mr-1.5" /> Add Section</Button>
                            </div>

                            {course.sections.length === 0 && (
                                <div className="border-2 border-dashed border-line-strong rounded-2xl p-12 text-center text-muted text-[14px] font-medium bg-canvas">
                                    <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center mx-auto mb-3">
                                        <Plus size={20} className="text-subtle" />
                                    </div>
                                    No sections yet. Create your first section above to begin building the curriculum.
                                </div>
                            )}

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {course.sections.map((section, idx) => {
                                        const open = openSections.includes(section._id)
                                        const sectionLessons = (lessons || []).filter((l) => l.sectionId === section._id)
                                        const isAddingHere = activeSection === section._id
                                        return (
                                            <motion.div
                                                key={section._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn("border rounded-2xl overflow-hidden bg-canvas shadow-sm transition-all duration-200", dragOverSectionId === section._id && draggedSectionId !== section._id ? 'border-primary ring-2 ring-primary/20 scale-[1.01]' : 'border-line')}
                                                draggable
                                                onDragStartCapture={(e: React.DragEvent) => handleDragStart(e, section._id)}
                                                onDragEndCapture={handleDragEnd}
                                                onDragOver={(e: React.DragEvent) => handleDragOver(e, section._id)}
                                                onDrop={(e: React.DragEvent) => handleDrop(e, section._id)}
                                            >
                                                <div className="flex items-center justify-between px-5 py-4 bg-surface/80 hover:bg-surface cursor-pointer transition-colors" onClick={() => toggleSection(section._id)}>
                                                    <div className="flex items-center gap-3 font-bold text-[15px] text-fg flex-1">
                                                        <GripVertical size={16} className="text-subtle cursor-grab active:cursor-grabbing shrink-0" />
                                                        <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                            {open ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
                                                        </div>
                                                        {editingSectionId === section._id ? (
                                                            <div className="flex items-center gap-2 flex-1 max-w-sm mr-4" onClick={e => e.stopPropagation()}>
                                                                <Input
                                                                    className="h-9 bg-canvas text-[14px]"
                                                                    value={editingSectionTitle}
                                                                    onChange={e => setEditingSectionTitle(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') updateSectionMut.mutate({ sectionId: section._id, title: editingSectionTitle })
                                                                        if (e.key === 'Escape') setEditingSectionId(null)
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                <Button size="sm" className="h-9 px-3" disabled={!editingSectionTitle} loading={updateSectionMut.isPending} onClick={() => updateSectionMut.mutate({ sectionId: section._id, title: editingSectionTitle })}>Save</Button>
                                                                <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => setEditingSectionId(null)}>Cancel</Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="truncate">Section {idx + 1}: {section.title}</span>
                                                                <Badge tone="neutral" className="ml-2 font-bold shrink-0">{sectionLessons.length} lectures</Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {editingSectionId !== section._id && (
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingSectionTitle(section.title); setEditingSectionId(section._id); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle hover:text-primary hover:bg-primary/10 transition-colors" title="Edit section name">
                                                                <Pencil size={16} strokeWidth={2.5} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            showAlert({
                                                                title: 'Delete Section',
                                                                message: 'Are you sure you want to delete this section and its lectures?',
                                                                danger: true,
                                                                confirmText: 'Delete',
                                                                onConfirm: () => deleteSectionMut.mutate(section._id)
                                                            })
                                                        }} className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle hover:text-danger hover:bg-danger/10 transition-colors" title="Delete section">
                                                            <Trash2 size={16} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {open && (
                                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                            <div className="p-5 border-t border-line/80 space-y-3 bg-canvas">
                                                                {sectionLessons.length === 0 && <p className="text-[13px] font-medium text-subtle px-2 py-1">No lectures in this section yet.</p>}

                                                                <AnimatePresence>
                                                                    {sectionLessons.map((lesson, li) => (
                                                                        <motion.div key={lesson.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                                            {editingLessonId === lesson.id ? (
                                                                                <LessonEditor
                                                                                    lesson={lesson}
                                                                                    courseId={course.id}
                                                                                    courseTitle={course.title}
                                                                                    onClose={() => setEditingLessonId(null)}
                                                                                    onSaved={() => {
                                                                                        queryClient.invalidateQueries({ queryKey: ['admin-course', id] })
                                                                                        queryClient.invalidateQueries({ queryKey: ['lessons', id] })
                                                                                        setEditingLessonId(null)
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="rounded-xl border border-line p-3.5 bg-surface flex items-center justify-between gap-4 hover:border-line-strong transition-colors group">
                                                                                    <div className="flex items-center gap-3 text-[14px] min-w-0">
                                                                                        <span className="w-7 h-7 rounded-lg bg-surface2 grid place-items-center text-[12px] font-bold text-muted shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">{li + 1}</span>
                                                                                        <span className="font-bold text-fg truncate">{lesson.title}</span>
                                                                                        {lesson.isPreview && <Badge tone="success" className="text-[10px] font-bold shrink-0">Preview</Badge>}
                                                                                        {courseJobs.some(j => j.lessonId === lesson.id && (j.status === 'queued' || j.status === 'processing')) ? (
                                                                                            <Badge tone="primary" className="text-[10px] font-bold shrink-0 flex items-center gap-1">
                                                                                                <div className="w-1 h-1 rounded-full bg-current animate-pulse" /> Processing
                                                                                            </Badge>
                                                                                        ) : lesson.video?.fileUrl ? <Badge tone="primary" className="text-[10px] font-bold shrink-0">Uploaded</Badge>
                                                                                            : lesson.video?.youtubeUrl ? <Badge tone="neutral" className="text-[10px] font-bold shrink-0">YouTube</Badge>
                                                                                                : <Badge tone="warning" className="text-[10px] font-bold shrink-0">No video</Badge>}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                                        <span className="text-[12px] font-bold text-subtle flex items-center gap-1.5 mr-2 bg-surface2 px-2 py-1 rounded-md"><Clock size={12} /> {formatDuration(lesson.duration)}</span>
                                                                                        <button onClick={() => { setEditingLessonId(lesson.id); setActiveSection(null) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle hover:text-primary hover:bg-primary/10 transition-colors" title="Edit lecture"><Pencil size={14} strokeWidth={2.5} /></button>
                                                                                        <button onClick={() => {
                                                                                            showAlert({
                                                                                                title: 'Delete Lecture',
                                                                                                message: 'Delete this lecture?',
                                                                                                danger: true,
                                                                                                confirmText: 'Delete',
                                                                                                onConfirm: () => deleteLessonMut.mutate(lesson.id)
                                                                                            })
                                                                                        }} className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle hover:text-danger hover:bg-danger/10 transition-colors" title="Delete lecture"><Trash2 size={14} strokeWidth={2.5} /></button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </AnimatePresence>

                                                                {isAddingHere ? (
                                                                    <LessonComposer
                                                                        lessonForm={lessonForm}
                                                                        setLessonForm={setLessonForm}
                                                                        adding={adding}
                                                                        draftUpload={draftUpload}
                                                                        onCancel={() => { setActiveSection(null); resetLessonForm() }}
                                                                        onSubmit={() => handleAddLesson(section._id)}
                                                                    />
                                                                ) : (
                                                                    <button
                                                                        onClick={() => { setActiveSection(section._id); resetLessonForm() }}
                                                                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong py-3.5 text-[14px] font-bold text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all mt-2"
                                                                    >
                                                                        <Plus size={18} strokeWidth={2.5} /> Add lecture
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </Card>
                    )}
                </motion.div>
            </motion.div>
        </AdminPage>
    )
}

interface VideoFieldsValue { source: VideoSource; youtubeUrl: string; fileUrl: string; duration: number; pendingFile?: File | null }

function VideoFields({ value, onPatch, replaceConfirm, lessonId, courseId, courseTitle, lessonTitle, draftUpload, disabled }: {
    value: VideoFieldsValue
    onPatch: (patch: Partial<VideoFieldsValue>) => void
    replaceConfirm?: boolean
    lessonId?: string
    courseId?: string
    courseTitle?: string
    lessonTitle?: string
    draftUpload?: DraftUploadState
    disabled?: boolean
}) {
    const mins = Math.floor((value.duration || 0) / 60)
    const secs = (value.duration || 0) % 60
    const setMins = (m: number) => onPatch({ duration: Math.max(0, m || 0) * 60 + secs })
    const setSecs = (s: number) => onPatch({ duration: mins * 60 + Math.min(59, Math.max(0, s || 0)) })

    return (
        <div>
            <Label>Video source</Label>
            <div className="flex gap-2.5 mb-4">
                <button type="button" disabled={disabled} onClick={() => onPatch({ source: 'upload' })} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold border-b-2 transition-all disabled:opacity-60 disabled:pointer-events-none', value.source === 'upload' ? 'border-primary bg-primary-subtle text-primary' : 'border-transparent bg-surface2/50 text-muted hover:text-fg')}>
                    <Upload size={16} strokeWidth={2.5} /> Upload video
                </button>
                <button type="button" disabled={disabled} onClick={() => onPatch({ source: 'youtube' })} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold border-b-2 transition-all disabled:opacity-60 disabled:pointer-events-none', value.source === 'youtube' ? 'border-primary bg-primary-subtle text-primary' : 'border-transparent bg-surface2/50 text-muted hover:text-fg')}>
                    <Youtube size={16} strokeWidth={2.5} /> YouTube URL
                </button>
            </div>

            {value.source === 'youtube' ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                    <Field label="YouTube link">
                        <Input className="h-11 bg-canvas hover:border-line-strong transition-colors" placeholder="https://www.youtube.com/embed/VIDEO_ID" value={value.youtubeUrl} onChange={(e) => onPatch({ youtubeUrl: e.target.value })} />
                    </Field>
                    <div>
                        <Label>Duration</Label>
                        <div className="flex items-center gap-2">
                            <Input type="number" min={0} value={mins} onChange={(e) => setMins(+e.target.value)} className="w-24 h-11 bg-canvas" />
                            <span className="text-[13px] font-bold text-muted">min</span>
                            <Input type="number" min={0} max={59} value={secs} onChange={(e) => setSecs(+e.target.value)} className="w-24 h-11 bg-canvas" />
                            <span className="text-[13px] font-bold text-muted">sec</span>
                        </div>
                        <p className="text-[12px] font-medium text-subtle mt-2">YouTube length can't be detected automatically — enter it here.</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    {!lessonId ? (
                        draftUpload ? (
                            <div className="rounded-2xl border border-line bg-canvas overflow-hidden">
                                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-primary/5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Loader2 size={15} className="text-primary animate-spin shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-fg">Uploading video...</p>
                                            <p className="text-[11px] text-muted truncate">{draftUpload.fileName}</p>
                                        </div>
                                    </div>
                                    <span className="text-[12px] font-bold tabular-nums text-primary shrink-0">{Math.round(draftUpload.pct)}%</span>
                                </div>

                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] text-muted font-medium">{draftUpload.stage}</span>
                                        <span className="text-[10px] text-muted">Keep this page open</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                                            animate={{ width: `${draftUpload.pct}%` }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted/60 mt-2">Processing will start automatically after the upload finishes.</p>
                                </div>
                            </div>
                        ) : (
                        <div className="p-4 bg-surface2 rounded-xl border border-dashed border-line-strong text-center flex flex-col items-center justify-center py-6 hover:bg-surface2/80 transition-colors">
                            <input type="file" id="draft-video" className="hidden" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) onPatch({ pendingFile: file })
                            }} />
                            <label htmlFor="draft-video" className="cursor-pointer flex flex-col items-center gap-2 group w-full">
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", value.pendingFile ? "bg-primary/10 text-primary" : "bg-surface group-hover:bg-primary/5 group-hover:text-primary text-muted")}>
                                    <UploadCloud size={24} />
                                </div>
                                <span className="text-[14px] font-bold text-fg">
                                    {value.pendingFile ? value.pendingFile.name : "Click to select a video file"}
                                </span>
                                <span className="text-[12px] text-muted max-w-[280px] leading-tight">
                                    {value.pendingFile ? 'Ready to upload! Click Add lecture to save and process.' : 'Video will be automatically uploaded when you click Add lecture.'}
                                </span>
                            </label>
                        </div>
                        )
                    ) : (
                        <>
                            <VideoUpload
                                lessonId={lessonId}
                                onUploaded={(url, dur) => onPatch({ fileUrl: url, duration: dur || value.duration })}
                                initialUrl={value.fileUrl || undefined}
                                confirmMessage={replaceConfirm ? 'This will replace the current video for this lecture. Continue?' : undefined}
                                courseId={courseId}
                                courseTitle={courseTitle}
                                lessonTitle={lessonTitle}
                            />
                            {value.duration > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 mt-3 text-[12px] font-bold text-muted">
                                    <Clock size={14} /> Detected length: {formatDuration(value.duration)}
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}
        </div>
    )
}

function LessonComposer({
    lessonForm, setLessonForm, adding, draftUpload, onCancel, onSubmit
}: {
    lessonForm: typeof emptyLesson
    setLessonForm: React.Dispatch<React.SetStateAction<typeof emptyLesson>>
    adding: boolean
    draftUpload: DraftUploadState
    onCancel: () => void
    onSubmit: () => void
}) {
    const patch = (p: Partial<typeof emptyLesson>) => setLessonForm((prev) => ({ ...prev, ...p }))
    const canSubmit = !!lessonForm.title && (lessonForm.source === 'youtube' ? !!lessonForm.youtubeUrl : true)

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-l-4 border-primary bg-primary/5 border-y border-r border-line p-5 mt-3 shadow-sm">
            <p className="text-[15px] font-extrabold mb-4 text-fg tracking-tight">New Lecture</p>

            <Field label="Lecture title">
                <Input className="h-11 bg-canvas hover:border-line-strong transition-colors" placeholder="e.g. Introduction to Hooks" value={lessonForm.title} onChange={(e) => patch({ title: e.target.value })} autoFocus />
            </Field>

            <div className="my-4">
                <Field label="Description (optional)">
                    <RichTextEditor placeholder="Detailed description or notes for this lecture" value={lessonForm.description} onChange={(val) => patch({ description: val })} />
                </Field>
            </div>

            <VideoFields value={lessonForm} onPatch={patch} draftUpload={draftUpload} disabled={adding} />

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-line/50">
                <label className="flex items-center gap-2.5 text-[14px] font-bold cursor-pointer group">
                    <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors", lessonForm.isPreview ? "bg-success border-success" : "border-line-strong group-hover:border-success")}>
                        {lessonForm.isPreview && <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={lessonForm.isPreview} onChange={(e) => patch({ isPreview: e.target.checked })} />
                    <span className="flex items-center gap-1.5"><Eye size={16} className="text-success" /> Free preview</span>
                </label>
                <div className="flex gap-2.5">
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={adding} className="font-bold">Cancel</Button>
                    <Button size="sm" onClick={onSubmit} loading={adding} disabled={!canSubmit} className="font-bold shadow-soft px-4">Add lecture</Button>
                </div>
            </div>
        </motion.div>
    )
}

function LessonEditor({ lesson, courseId, courseTitle, onClose, onSaved }: { lesson: Lesson; courseId: string; courseTitle: string; onClose: () => void; onSaved: () => void }) {
    const [title, setTitle] = useState(lesson.title)
    const [description, setDescription] = useState(lesson.description || '')
    const [isPreview, setIsPreview] = useState(lesson.isPreview)
    const [video, setVideo] = useState<VideoFieldsValue>({
        source: lesson.video?.youtubeUrl ? 'youtube' : 'upload',
        youtubeUrl: lesson.video?.youtubeUrl || '',
        fileUrl: lesson.video?.fileUrl || '',
        duration: lesson.duration || 0
    })
    const [resources, setResources] = useState<LessonResource[]>(lesson.resources || [])
    const [saving, setSaving] = useState(false)
    const patchVideo = (p: Partial<VideoFieldsValue>) => setVideo((prev) => ({ ...prev, ...p }))

    const handleSave = async () => {
        if (!title) return toast.error('Title is required')

        let youtubeUrl = ''
        if (video.source === 'youtube') {
            const embed = toYouTubeEmbed(video.youtubeUrl)
            if (!embed) return toast.error('Enter a valid YouTube link, e.g. https://www.youtube.com/embed/VIDEO_ID')
            youtubeUrl = embed
        }

        setSaving(true)
        try {
            await updateLesson(lesson.id, {
                title,
                description,
                duration: video.duration,
                isPreview,
                youtubeUrl,
                fileUrl: video.source === 'upload' ? video.fileUrl : '',
                resources
            })
            toast.success('Lecture updated')
            onSaved()
        } catch {
            toast.error('Failed to update lecture')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border-l-4 border-primary bg-primary/5 border-y border-r border-line p-5 mb-3 shadow-sm">
            <p className="text-[15px] font-extrabold mb-4 text-fg tracking-tight">Edit Lecture</p>

            <Field label="Lecture title"><Input className="h-11 bg-canvas hover:border-line-strong transition-colors" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></Field>

            <div className="my-4">
                <Field label="Description (optional)"><RichTextEditor className="placeholder:opacity-60" value={description} onChange={setDescription} placeholder="Detailed description or notes for this lecture" /></Field>
            </div>

            <VideoFields value={video} onPatch={patchVideo} replaceConfirm lessonId={lesson.id} courseId={courseId} courseTitle={courseTitle} lessonTitle={title} />

            <div className="mt-5 pt-5 border-t border-line/50">
                <ResourceManager resources={resources} setResources={setResources} />
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-line/50">
                <label className="flex items-center gap-2.5 text-[14px] font-bold cursor-pointer group">
                    <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors", isPreview ? "bg-success border-success" : "border-line-strong group-hover:border-success")}>
                        {isPreview && <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} />
                    <span className="flex items-center gap-1.5"><Eye size={16} className="text-success" /> Free preview</span>
                </label>
                <div className="flex gap-2.5">
                    <Button variant="ghost" size="sm" onClick={onClose} className="font-bold">Cancel</Button>
                    <Button size="sm" onClick={handleSave} loading={saving} disabled={!title} className="font-bold shadow-soft px-4">Save changes</Button>
                </div>
            </div>
        </motion.div>
    )
}

function formatBytes(bytes?: number) {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let n = bytes
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

function ResourceManager({ resources, setResources }: {
    resources: LessonResource[]
    setResources: React.Dispatch<React.SetStateAction<LessonResource[]>>
}) {
    const maxResourceSize = 10 * 1024 * 1024
    const acceptedResourceTypes = [
        '.pdf', '.zip', '.txt', '.md', '.csv', '.json',
        '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        'application/pdf', 'application/zip', 'text/plain', 'text/markdown', 'text/csv',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'
    ].join(',')
    const fileRef = useRef<HTMLInputElement>(null)
    const [progress, setProgress] = useState<number | null>(null)

    const handleFile = async (file: File | undefined) => {
        if (!file) return
        if (file.size > maxResourceSize) {
            toast.error('Resource file must be 10 MB or smaller')
            if (fileRef.current) fileRef.current.value = ''
            return
        }
        setProgress(0)
        try {
            const result = await uploadResource(file, setProgress)
            setResources((prev) => [...prev, { title: result.fileName, url: result.path, type: result.type, size: result.size }])
            toast.success('Resource uploaded')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to upload resource')
        } finally {
            setProgress(null)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <div>
            <Label>Lecture resources</Label>
            <p className="text-[12px] font-medium text-subtle mb-3">Attach PDFs, ZIPs, images, text files, notes, or source files students can download. Max 10 MB each.</p>

            {resources.length > 0 && (
                <div className="space-y-2.5 mb-4">
                    <AnimatePresence>
                        {resources.map((r, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 rounded-xl border border-line p-2.5 bg-canvas shadow-sm group">
                                <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center shrink-0">
                                    <FileText size={16} className="text-muted" />
                                </div>
                                <Input
                                    value={r.title}
                                    onChange={(e) => setResources((prev) => prev.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))}
                                    className="h-9 flex-1 bg-surface2/50 border-transparent hover:border-line-strong transition-colors"
                                />
                                {r.size ? <Badge tone="neutral" className="text-[10px] font-bold shrink-0">{formatBytes(r.size)}</Badge> : null}
                                <button type="button" onClick={() => setResources((prev) => prev.filter((_, xi) => xi !== i))} className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
                                    <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <input ref={fileRef} type="file" accept={acceptedResourceTypes} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={progress !== null}
                className="font-bold shadow-sm"
            >
                {progress !== null ? <><Loader2 size={16} strokeWidth={2.5} className="animate-spin mr-1.5" /> Uploading {progress}%</> : <><Paperclip size={16} strokeWidth={2.5} className="mr-1.5" /> Upload resource</>}
            </Button>
        </div>
    )
}
