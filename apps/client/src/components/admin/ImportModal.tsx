import React, { useRef, useState } from 'react'
import { Upload, X, FileText, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as xlsx from 'xlsx'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => Promise<any>
  title: string
  templateHeaders: string[]
  templateFileName: string
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  title,
  templateHeaders,
  templateFileName
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const ws = xlsx.utils.aoa_to_sheet([templateHeaders])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Template')
    xlsx.writeFile(wb, `${templateFileName}.csv`, { bookType: 'csv' })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const res = await onImport(file)
      setResult(res)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to import file')
    } finally {
      setIsUploading(false)
    }
  }

  const resetAndClose = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={resetAndClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-md bg-card border border-line rounded-card shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-line">
            <h3 className="text-lg font-semibold text-fg">{title}</h3>
            <button onClick={resetAndClose} className="p-1 text-subtle hover:text-fg transition-colors rounded-full hover:bg-surface">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {!result ? (
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={downloadTemplate} className="text-sm text-primary hover:underline flex items-center gap-1">
                    <DownloadIcon size={14} /> Download Template
                  </button>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-card p-8 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-line hover:border-primary/50'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      setFile(e.dataTransfer.files[0])
                      setResult(null)
                      setError(null)
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      {file.name.endsWith('.csv') ? <FileText size={48} className="text-subtle mb-2" /> : <FileSpreadsheet size={48} className="text-success mb-2" />}
                      <p className="text-sm font-medium text-fg">{file.name}</p>
                      <p className="text-xs text-muted mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                      <button onClick={() => setFile(null)} className="text-xs text-danger hover:underline mt-2">Remove</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={48} className="text-subtle mb-2" />
                      <p className="text-sm font-medium text-fg">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted mt-1">CSV or Excel (XLSX) files only</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h4 className="text-lg font-semibold text-fg mb-2">Import Complete</h4>
                <div className="inline-block text-left bg-surface rounded-md p-4 mt-2">
                  <p className="text-sm text-subtle mb-1">Total Rows: <span className="font-medium text-fg">{result.total}</span></p>
                  <p className="text-sm text-success mb-1">Imported: <span className="font-medium">{result.imported}</span></p>
                  <p className="text-sm text-warning">Skipped (Duplicates/Invalid): <span className="font-medium">{result.skipped}</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-line bg-surface">
            {result ? (
              <button
                onClick={resetAndClose}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={resetAndClose}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-fg hover:bg-surface2 rounded-btn transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Data'
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function DownloadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
