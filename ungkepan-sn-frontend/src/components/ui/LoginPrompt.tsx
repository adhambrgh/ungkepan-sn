import { Link } from 'react-router-dom'
import { X, SignIn, UserPlus } from '@phosphor-icons/react'

type Props = {
  open: boolean
  onClose: () => void
  redirect?: string
  context?: string
}

export default function LoginPrompt({ open, onClose, redirect = '/', context = 'belanja' }: Props) {
  if (!open) return null

  const loginTo = `/login?redirect=${encodeURIComponent(redirect)}`
  const signupTo = `/signup?redirect=${encodeURIComponent(redirect)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[400px] bg-white rounded-2xl border border-zinc-100 shadow-2xl p-8 animate-scale-in">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 flex items-center justify-center w-9 h-9 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Masuk dulu,
          <br />
          baru bisa {context}.
        </h2>
        <p className="mt-3 text-[14.5px] text-zinc-500 leading-relaxed">
          Biar pesananmu tercatat dan checkoutnya cepat, kamu perlu akun dulu. Gratis, kok — cuma isi email atau pakai Google.
        </p>

        <div className="mt-7 space-y-3">
          <Link
            to={loginTo}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-[.99] rounded-xl transition-all"
          >
            <SignIn size={18} weight="bold" />
            Masuk
          </Link>
          <Link
            to={signupTo}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 active:scale-[.99] rounded-xl transition-all"
          >
            <UserPlus size={18} weight="bold" />
            Daftar Akun Baru
          </Link>
          <button
            onClick={onClose}
            className="w-full py-2 text-[13.5px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}