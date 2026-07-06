import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X, Link2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage } from '../../services/video.service'
import { Input } from '../ui/Input'
import { cn } from '../../lib/utils'

interface ImageUploadProps {
  value: string // the key
  previewUrl?: string // the full url
  onChange: (key: string, url?: string) => void
  placeholder?: string
}

export function ImageUpload({ value, previewUrl, onChange, placeholder = 'https://...' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [mode, setMode] = useState<'upload' | 'url'>('upload')

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    setProgress(0)
    try {
      const result = await uploadImage(file, setProgress)
      onChange(result.key, result.url)
      toast.success('Thumbnail uploaded')
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setProgress(null)
    }
  }

  const uploading = progress !== null

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('upload')} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs border-l-2 transition-colors', mode === 'upload' ? 'border-primary bg-surface2 text-fg font-medium' : 'border-transparent bg-surface2/50 text-muted hover:text-fg')}>
          <Upload size={13} /> Upload
        </button>
        <button type="button" onClick={() => setMode('url')} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs border-l-2 transition-colors', mode === 'url' ? 'border-primary bg-surface2 text-fg font-medium' : 'border-transparent bg-surface2/50 text-muted hover:text-fg')}>
          <Link2 size={13} /> Paste URL
        </button>
      </div>

      {value || previewUrl ? (
        <div className="relative w-full overflow-hidden rounded-input border border-line">
          <img src={previewUrl || value} alt="Thumbnail preview" className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={() => onChange('', '')}
            className="absolute top-2 right-2 grid place-items-center w-7 h-7 rounded-full bg-canvas/80 text-fg hover:bg-danger hover:text-white transition-colors"
            aria-label="Remove thumbnail"
          >
            <X size={15} />
          </button>
        </div>
      ) : mode === 'upload' ? (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && handleFile(e.dataTransfer.files[0]) }}
            className="w-full flex flex-col items-center justify-center gap-1.5 rounded-input border border-dashed border-line-strong py-6 text-center transition-colors hover:border-primary hover:bg-surface2 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={22} className="animate-spin text-primary" /> : <ImagePlus size={22} className="text-muted" />}
            <p className="text-sm font-medium">{uploading ? `Uploading… ${progress}%` : 'Click or drag an image'}</p>
            {!uploading && <p className="text-xs text-muted">JPG, PNG, WebP up to 5MB</p>}
          </button>
          {uploading && (
            <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </>
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
}
