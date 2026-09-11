import { X } from '@phosphor-icons/react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  image?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title, message, image, confirmLabel = 'Keluar', cancelLabel = 'Batal', onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 px-6 pt-8 pb-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400"
        >
          <X size={16} />
        </button>

        <div className="relative w-44 h-44 mx-auto mb-6">
          <img
            src={image || '/Warning Illustration.png'}
            alt=""
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>

        <h3 className="text-xl font-bold text-zinc-800">{title}</h3>
        <p className="text-zinc-500 mt-1">{message}</p>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={onConfirm}
            className="px-6 py-3 text-sm font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-[8px] transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
