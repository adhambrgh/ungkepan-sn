import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from '@phosphor-icons/react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  visible: boolean
  onClose: () => void
}

export default function Toast({ message, type = 'success', visible, onClose }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300)
      }, 2500)
      return () => clearTimeout(timer)
    }
    setShow(false)
  }, [visible])

  if (!visible && !show) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border px-6 py-6 sm:px-8 flex items-center gap-4 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[320px] transition-all duration-300 ${
          show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'
        } ${
          type === 'success' ? 'border-green-200' : 'border-red-200'
        }`}
      >
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${
            type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
          }`}
        >
          {type === 'success' ? (
            <CheckCircle size={24} weight="fill" />
          ) : (
            <XCircle size={24} weight="fill" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {type === 'success' ? 'Berhasil' : 'Gagal'}
          </p>
          <p className="text-sm text-zinc-500 truncate">{message}</p>
        </div>
        <button
          onClick={() => { setShow(false); setTimeout(onClose, 300) }}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
