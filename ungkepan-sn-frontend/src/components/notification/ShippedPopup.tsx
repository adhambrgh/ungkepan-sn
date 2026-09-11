import { Link } from 'react-router-dom'
import { Truck, X } from '@phosphor-icons/react'
import { useShippedNotifications } from '../../hooks/useShippedNotifications'

export default function ShippedPopup() {
  const { newShipped, dismiss } = useShippedNotifications()

  if (newShipped.length === 0) return null

  const codes = newShipped.map((o) => o.id).join(', ')

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-brand-100 overflow-hidden">
        <div className="bg-brand-600 px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15">
              <Truck size={20} weight="fill" className="text-white" />
            </div>
            <h2 className="text-white font-bold text-[15px]">Pesananmu Lagi Dikirim</h2>
          </div>
          <button
            onClick={dismiss}
            className="flex items-center justify-center w-7 h-7 rounded-full text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Pesanan <strong className="text-zinc-800">{codes}</strong> sudah dalam perjalanan
            menuju kamu. Saat sudah sampai di tangan,{' '}
            <strong className="text-zinc-800">jangan lupa konfirmasi</strong> biar pesananmu
            tercatat sebagai Selesai.
          </p>
          <div className="mt-5 flex gap-2">
            <Link
              to="/profil"
              onClick={dismiss}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl active:scale-95 transition-all"
            >
              Lihat Pesanan
            </Link>
            <button
              onClick={dismiss}
              className="px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}