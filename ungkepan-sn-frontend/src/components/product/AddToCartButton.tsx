import { useState } from 'react'
import { ShoppingCart } from '@phosphor-icons/react'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import type { Product } from '../../types'
import QuantityPickerModal from './QuantityPickerModal'

type Props = {
  product: Product
  onRequireLogin: () => void
  iconOnly?: boolean
}

export default function AddToCartButton({ product, onRequireLogin, iconOnly = false }: Props) {
  const addItems = useCartStore((s) => s.addItems)
  const authToken = useAuthStore((s) => s.token)
  const [open, setOpen] = useState(false)

  const outOfStock = product.stock === 0

  const openPicker = () => {
    if (!authToken) {
      onRequireLogin()
      return
    }
    setOpen(true)
  }

  const confirm = (p: Product, qty: number) => {
    addItems(p, qty)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        disabled={outOfStock}
        className={`${
          iconOnly
            ? 'flex items-center justify-center w-9 h-9 rounded-[8px] transition-colors text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed p-0'
            : 'flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-[8px] transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800'
        }`}
      >
        <ShoppingCart size={16} weight="bold" />
        {iconOnly ? null : <span>Keranjang</span>}
      </button>
      <QuantityPickerModal product={product} open={open} onClose={() => setOpen(false)} onConfirm={confirm} />
    </>
  )
}
