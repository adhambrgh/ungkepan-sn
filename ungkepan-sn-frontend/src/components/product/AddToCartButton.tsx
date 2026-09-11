import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Minus, ShoppingCart, X } from '@phosphor-icons/react'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import type { Product } from '../../types'

type Props = {
  product: Product
  onRequireLogin: () => void
}

export default function AddToCartButton({ product, onRequireLogin }: Props) {
  const addItems = useCartStore((s) => s.addItems)
  const authToken = useAuthStore((s) => s.token)
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [qtyError, setQtyError] = useState(false)

  const outOfStock = product.stock === 0
  const max = Math.max(product.stock || 1, 1)

  const openPicker = () => {
    if (!authToken) {
      onRequireLogin()
      return
    }
    setQty(1)
    setQtyError(false)
    setOpen(true)
  }

  const confirm = () => {
    if (qtyError || qty < 1 || qty > max) return
    addItems(product, qty)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        disabled={outOfStock}
        className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-[8px] transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800"
      >
        <ShoppingCart size={16} weight="bold" />
        Keranjang
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="Tutup"
              >
                <X size={16} weight="bold" />
              </button>

              <div className="aspect-[16/9] bg-zinc-100">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-zinc-800 leading-snug line-clamp-1">{product.name}</h3>
                <p className="mt-1 font-bold text-brand-600">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>

                <div className="mt-5 flex items-center justify-between rounded-xl border border-black/10 overflow-hidden h-12">
                  <button
                    type="button"
                    onClick={() => setQty((v) => {
                      const n = Math.max(1, v - 1)
                      if (n <= max) setQtyError(false)
                      return n
                    })}
                    className="w-12 h-full flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus size={17} weight="bold" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={max}
                    value={qty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (e.target.value === '') {
                        setQtyError(false)
                        return
                      }
                      if (isNaN(v)) {
                        setQty(1)
                        setQtyError(false)
                        return
                      }
                      setQty(v)
                      setQtyError(v > max)
                    }}
                    onBlur={() => {
                      if (qty < 1 || Number.isNaN(qty)) {
                        setQty(1)
                        setQtyError(false)
                      }
                    }}
                    className="w-14 text-center text-lg font-bold text-zinc-800 tabular-nums focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((v) => {
                      const n = Math.min(v + 1, max)
                      setQtyError(false)
                      return n
                    })}
                    disabled={qty >= max}
                    className="w-12 h-full flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                    aria-label="Tambah jumlah"
                  >
                    <Plus size={17} weight="bold" />
                  </button>
                </div>

                {qtyError && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    Jumlah melebihi stok. Stok tersedia: {product.stock}.
                  </p>
                )}

                <p className="mt-2 text-xs text-zinc-400">
                  {product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok habis'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-sm font-semibold rounded-[8px] text-zinc-600 border-2 border-zinc-200 hover:bg-zinc-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={qtyError}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-bold rounded-[8px] text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart size={16} weight="bold" />
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}