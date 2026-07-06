import { Modal } from './Modal'
import { Button } from './Button'
import { useAlertStore } from '../../store/alertStore'
import { AlertTriangle, Info } from 'lucide-react'

export function AppAlert() {
  const { open, title, message, confirmText, cancelText, danger, onConfirm, closeAlert } = useAlertStore()

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    closeAlert()
  }

  return (
    <Modal open={open} onClose={closeAlert} className="max-w-[400px]">
      <div className="flex flex-col items-center text-center px-2 py-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${danger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
          {danger ? <AlertTriangle size={28} /> : <Info size={28} />}
        </div>
        <h3 className="text-xl font-bold text-fg mb-3">{title}</h3>
        <p className="text-[15px] text-muted mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full">
          <Button variant="ghost" className="flex-1 font-bold h-11" onClick={closeAlert}>
            {cancelText}
          </Button>
          <Button 
            className={`flex-1 font-bold shadow-soft h-11 ${danger ? 'bg-danger text-danger-fg hover:bg-danger/90 border-transparent' : ''}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
