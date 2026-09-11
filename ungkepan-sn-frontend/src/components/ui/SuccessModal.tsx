import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

interface SuccessModalProps {
  open: boolean
  title?: string
  message?: string
  autoCloseMs?: number
  onConfirm: () => void
}

export default function SuccessModal({
  open,
  title = 'Berhasil!',
  message = 'Data berhasil disimpan.',
  autoCloseMs = 2000,
  onConfirm,
}: SuccessModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onConfirm()
    }
    window.addEventListener('keydown', handler)
    const timer = setTimeout(onConfirm, autoCloseMs)
    return () => {
      window.removeEventListener('keydown', handler)
      clearTimeout(timer)
    }
  }, [open, onConfirm, autoCloseMs])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      onClick={onConfirm}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-md px-10 py-12 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onConfirm}
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        <div className="mx-auto mb-6 w-20 h-20 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F0FDF4" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            </defs>
            <path d="M14 30 L18 26 M10 40 L16 40 M14 50 L18 54" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M86 30 L82 26 M90 40 L84 40 M86 50 L82 54" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="40" fill="url(#successGradient)" stroke="#15803D" strokeWidth="3" />
            <polyline
              points="30,52 44,66 70,38"
              fill="none"
              stroke="#fff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="success-modal-title" className="text-2xl font-extrabold text-zinc-800">
          {title}
        </h2>
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}