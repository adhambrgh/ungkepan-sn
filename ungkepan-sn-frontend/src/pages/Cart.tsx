import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash, Minus, Plus, ArrowLeft } from '@phosphor-icons/react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { applyCustomerPromo } from '../api/client'
import LoginPrompt from '../components/ui/LoginPrompt'

export default function Cart() {
  const { items, removeItem, updateQuantity, toggleSelected, setAllSelected, discount, discountInfo, getSubtotal, applyDiscount, clearDiscount, getTotal } = useCartStore()
  const authToken = useAuthStore((s) => s.token)
  const [promoCode, setPromoCode] = useState('')
  const [promoMsg, setPromoMsg] = useState('')
  const [promoOk, setPromoOk] = useState(false)
  const [applying, setApplying] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    if (!authToken) setShowLoginPrompt(true)
  }, [authToken])

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase()
    if (!code) return
    if (!authToken) {
      setPromoMsg('Masuk dulu untuk memakai kode promo')
      setPromoOk(false)
      return
    }
    setApplying(true)
    setPromoMsg('')
    setPromoOk(false)
    try {
      const res = await applyCustomerPromo(code, getSubtotal())
      applyDiscount(res.amount, { code: res.code, type: res.type, value: res.value })
      setPromoMsg(`Kode promo "${res.code}" berhasil diterapkan`)
      setPromoOk(true)
    } catch (err: any) {
      setPromoMsg(err?.message || 'Kode promo tidak dapat dipakai')
      clearDiscount()
    } finally {
      setApplying(false)
    }
  }

  const removePromo = () => {
    clearDiscount()
    setPromoMsg('')
    setPromoCode('')
  }

  if (!authToken) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <img
              src="/keranjangkosong.png"
              alt="Keranjang kosong"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-zinc-800 mb-2">Keranjang Kosong</h1>
          <p className="text-zinc-500 mb-6">Masuk atau daftar dulu untuk mulai belanja.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors"
          >
            Lihat Produk
          </Link>
        </main>
        <LoginPrompt
          open={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          redirect="/cart"
          context="belanja"
        />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
        <div className="relative w-48 h-48 mx-auto mb-8">
          <img
            src="/keranjangkosong.png"
            alt="Keranjang kosong"
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>
        <h1 className="text-2xl font-bold text-zinc-800 mb-2">Keranjang Kosong</h1>
        <p className="text-zinc-500 mb-6">Belum ada produk yang kamu pilih</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors"
        >
          Lihat Produk
        </Link>
      </main>
    )
  }

  return (
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Keranjang</h1>
          <p className="text-zinc-500 text-sm md:text-base">{items.filter((i) => i.selected).length} produk dipilih</p>
        </div>
        <Link to="/products" className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm">
          <ArrowLeft size={18} /> Tambah Produk
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={items.length > 0 && items.every((i) => i.selected)}
          onChange={(e) => setAllSelected(e.target.checked)}
          className="w-4 h-4 accent-[#EA580C] cursor-pointer"
          aria-label="Pilih semua"
        />
        <span className="text-sm text-zinc-600 font-medium">Pilih Semua</span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex gap-4 p-4 bg-white rounded-[8px] border border-zinc-100"
          >
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => toggleSelected(item.product.id)}
              className="mt-1 w-5 h-5 shrink-0 accent-[#EA580C] cursor-pointer"
              aria-label={`Pilih ${item.product.name}`}
            />
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-20 h-20 md:w-24 md:h-24 rounded-[8px] object-cover shrink-0 bg-zinc-100"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-zinc-800 text-sm md:text-base mb-1">
                {item.product.name}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500">Harga satuan</p>
                <p className="font-semibold text-zinc-700 text-sm">
                  Rp {item.product.price.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-zinc-500">Jumlah</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                  >
                    <Minus size={14} weight="bold" />
                  </button>
<input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product.id, Math.max(1, Number(e.target.value)))}
                    className="w-24 rounded-[8px] border border-zinc-200 px-2 text-sm outline-none focus:border-brand-500 transition-colors text-center"
                  />
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-zinc-500">Stok</p>
                {item.product.stock > 0 ? (
                  <p className="text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {item.product.stock} Tersedia
                  </p>
                ) : (
                  <p className="text-sm font-bold text-red-500">Habis</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <p className="font-bold text-zinc-800 text-sm md:text-base">
                Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
              </p>
              <button
                onClick={() => removeItem(item.product.id)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash size={14} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 p-6 bg-white rounded-[8px] border border-zinc-100">
        {discount > 0 ? (
          <div className="flex items-center justify-between mb-5 bg-zinc-50 border border-zinc-200 rounded-[8px] px-3 py-2.5">
            <p className="text-xs font-semibold text-[#EA580C]">
              Kode promo diterapkan
            </p>
            <button
              onClick={removePromo}
              className="px-3 py-1.5 rounded-[8px] bg-[#EA580C] hover:bg-[#d94e0b] text-white text-xs font-semibold transition-colors"
            >
              Hapus
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-5">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value)
                setPromoMsg('')
              }}
              placeholder="Masukkan kode promo"
              className="flex-1 min-w-0 rounded-[8px] border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyPromo()
              }}
            />
            <button
              onClick={applyPromo}
              disabled={applying}
              className="px-4 py-2 rounded-[8px] bg-[#EA580C] hover:bg-[#d94e0b] text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {applying ? 'Memeriksa...' : 'Pakai'}
            </button>
          </div>
        )}
        {promoMsg && discount === 0 && (
          <p className={`text-xs -mt-3 mb-3 ${promoOk ? 'text-green-600' : 'text-red-500'}`}>{promoMsg}</p>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-500">Subtotal</span>
          <span className="text-zinc-700 font-medium">
            Rp {getSubtotal().toLocaleString('id-ID')}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500">
              Diskon{discountInfo?.type === 'percent' ? ` (${discountInfo.value}%)` : ''}
            </span>
            <span className="text-[#EA580C] font-medium">
              -Rp {discount.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4 border-t border-zinc-100 pt-3">
          <span className="font-bold text-zinc-800">Total setelah diskon</span>
          <span className="font-bold text-lg text-[#EA580C]">
            Rp {getTotal().toLocaleString('id-ID')}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          *Ongkir dihitung saat checkout nanti.
        </p>
        <Link
          to={authToken ? '/checkout' : '/login?redirect=/checkout'}
          className="flex items-center justify-center w-full px-6 py-3 text-sm font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors"
        >
          {authToken ? 'Lanjut ke Checkout' : 'Masuk untuk Checkout'}
        </Link>
      </div>
    </main>
  )
}

function QuantityInput({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  const [text, setText] = useState(String(value))

  const commit = () => {
    const parsed = parseInt(text, 10)
    const next = Number.isNaN(parsed) ? value : Math.max(1, parsed)
    setText(String(next))
    onChange(next)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      className="font-bold text-lg w-10 text-center border border-zinc-200 rounded-[8px] py-0.5 focus:border-brand-500 focus:outline-none"
    />
  )
}
