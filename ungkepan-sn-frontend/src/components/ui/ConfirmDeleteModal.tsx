import { useEffect } from 'react'

interface ConfirmDeleteModalProps {
  open: boolean
  title?: string
  message?: string
  cancelLabel?: string
  confirmLabel?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteModal({
  open,
  title = 'Hapus item ini?',
  message = 'Apakah Anda yakin ingin menghapus elemen ini? Tindakan ini tidak dapat dibatalkan.',
  cancelLabel = 'Batal',
  confirmLabel = 'Hapus',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-md px-10 py-12 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-40 h-40 mx-auto mb-6">
          <img
            src="/Warning Illustration.png"
            alt=""
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>

        <h2 id="confirm-delete-title" className="text-2xl font-extrabold text-zinc-800">
          {title}
        </h2>
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{message}</p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="py-3 rounded-xl border-2 border-[#F5730C] text-zinc-800 font-bold text-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}