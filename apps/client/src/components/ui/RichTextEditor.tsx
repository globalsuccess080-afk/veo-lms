import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { cn } from '../../lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
}

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link'
]

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  return (
    <div className={cn("rich-text-editor-wrapper bg-canvas rounded-xl border border-line overflow-hidden hover:border-line-strong transition-all", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-full min-h-[150px] flex flex-col"
      />
      <style>{`
        .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--line);
          background-color: var(--surface2);
          font-family: inherit;
        }
        .rich-text-editor-wrapper .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: 120px;
          color: var(--fg);
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: var(--muted);
          font-style: normal;
        }
        .rich-text-editor-wrapper .ql-snow .ql-stroke {
          stroke: var(--fg);
        }
        .rich-text-editor-wrapper .ql-snow .ql-fill {
          fill: var(--fg);
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker {
          color: var(--fg);
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker-options {
          background-color: var(--surface);
          border-color: var(--line);
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker-item {
          color: var(--fg) !important;
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker-item:hover,
        .rich-text-editor-wrapper .ql-snow .ql-picker-item.ql-selected {
          color: var(--primary) !important;
        }
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          border-color: var(--line);
        }
      `}</style>
    </div>
  )
}
