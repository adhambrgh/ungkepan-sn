import { CreditCard, CurrencyDollar } from '@phosphor-icons/react'
import type { PaymentMethod } from '../../api/client'

interface PaymentSelectorProps {
  paymentMethods: PaymentMethod[]
  selectedPaymentId: string | undefined
  onSelect: (id: string) => void
  copiedText: string
  onCopy: (text: string, label: string) => void
  showQrisModal: boolean
  setShowQrisModal: (v: boolean) => void
  qrisMethod: PaymentMethod | undefined
}

export default function PaymentSelector({
  paymentMethods,
  selectedPaymentId,
  onSelect,
}: PaymentSelectorProps) {
  const midtransMethod = paymentMethods.find((m) => m.method === 'midtrans' && m.is_active)
  const codMethod = paymentMethods.find((m) => m.method === 'cod' && m.is_active)

  return (
    <div className="space-y-2">
      {midtransMethod && (
        <label
          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
            selectedPaymentId === String(midtransMethod.id)
              ? 'border-brand-500 bg-brand-50'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <input
            type="radio"
            value={String(midtransMethod.id)}
            checked={selectedPaymentId === String(midtransMethod.id)}
            onChange={() => onSelect(String(midtransMethod.id))}
            className="w-5 h-5 accent-brand-500 shrink-0"
          />
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 shrink-0">
            <CreditCard size={20} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-zinc-800 text-sm">Bayar Online (Midtrans)</span>
            <p className="text-xs text-zinc-400">Kartu, Virtual Account, E-Wallet, QRIS, Minimarket</p>
          </div>
        </label>
      )}

      {codMethod && (
        <label
          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
            selectedPaymentId === String(codMethod.id)
              ? 'border-brand-500 bg-brand-50'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <input
            type="radio"
            value={String(codMethod.id)}
            checked={selectedPaymentId === String(codMethod.id)}
            onChange={() => onSelect(String(codMethod.id))}
            className="w-5 h-5 accent-brand-500 shrink-0"
          />
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 shrink-0">
            <CurrencyDollar size={20} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-zinc-800 text-sm">Bayar di Tempat (COD)</span>
            <p className="text-xs text-zinc-400">Bayar pas barang sampai</p>
          </div>
        </label>
      )}

      {!midtransMethod && !codMethod && (
        <p className="text-sm text-zinc-400 text-center py-4">Belum ada metode pembayaran</p>
      )}
    </div>
  )
}
