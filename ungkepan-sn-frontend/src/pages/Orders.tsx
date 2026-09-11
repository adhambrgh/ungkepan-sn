import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from '@phosphor-icons/react'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { getMyOrders, confirmOrderReceived, getProducts } from '../api/client'
import { isAwaitingConfirm } from '../utils/orderStatus'
import type { Order, CartItem, Product } from '../types'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Konfirmasi', color: 'text-amber-500' },
  processed: { label: 'Diproses', color: 'text-blue-500' },
  shipped: { label: 'Dikirim', color: 'text-brand-500' },
  completed: { label: 'Selesai', color: 'text-green-500' },
}

const statusFilters = [
  { value: '', label: 'Semua' },
  { value: 'active', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
]

type DbOrderItem = { product_id: number; product_name: string; product_price: number; quantity: number }
type DbOrder = {
  id: number
  order_code: string
  status: string
  total: number
  created_at: string
  payment_method: string
  shipping_method: string
  items: DbOrderItem[]
}

function buildItem(it: DbOrderItem, productsMap: Map<string, Product>): CartItem {
  const p = productsMap.get(String(it.product_id))
  return {
    quantity: it.quantity,
    selected: true,
    product: {
      id: String(it.product_id),
      name: it.product_name || p?.name || '',
      category: p?.category ?? '',
      categoryName: p?.categoryName,
      price: Number(it.product_price) || 0,
      image: p?.image ?? '',
      description: p?.description ?? '',
      weight: p?.weight ?? '',
      stock: p?.stock ?? 0,
    },
  }
}

function mergeOrders(primary: Order[], secondary: Order[]): Order[] {
  const map = new Map<string, Order>()
  secondary.forEach((o) => map.set(o.id, o))
  primary.forEach((o) => map.set(o.id, o))
  return [...map.values()]
}

function toOrder(db: DbOrder, productsMap: Map<string, Product>): Order {
  return {
    id: db.order_code,
    items: (db.items || []).map((it) => buildItem(it, productsMap)),
    total: Number(db.total) || 0,
    customerName: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    shippingMethod: db.shipping_method || '',
    paymentMethod: db.payment_method || '',
    status: (['pending', 'processed', 'shipped', 'completed'] as const).includes(db.status as any)
      ? (db.status as Order['status'])
      : 'pending',
    createdAt: db.created_at || new Date().toISOString(),
  }
}

export default function Orders() {
  const authToken = useAuthStore((s) => s.token)
  const localOrders = useCartStore((s) => s.orders)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmMsg, setConfirmMsg] = useState('')

  useEffect(() => {
    setOrders((prev) => {
      const ids = new Set(prev.map((o) => o.id))
      const fresh = localOrders.filter((o) => !ids.has(o.id))
      return fresh.length ? [...fresh, ...prev] : prev
    })
  }, [localOrders])

  useEffect(() => {
    let active = true

    const load = async () => {
      const productsMap = new Map<string, Product>()
      try {
        const products = await getProducts()
        products.forEach((p) => productsMap.set(p.id, p))
      } catch {
        // produk tak tersedia; gambar fallback kosong
      }

      if (!active) return

      if (authToken) {
        try {
          const dbOrders = await getMyOrders()
          if (active) {
            const serverOrders = (dbOrders || []).map((o: any) => toOrder(o, productsMap))
            setOrders(mergeOrders(serverOrders, localOrders))
          }
          return
        } catch {
          // api tidak tersedia fallback: hanya pesanan lokal
          if (active) setOrders(localOrders)
        }
      } else if (active) {
        setOrders(localOrders)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [authToken, localOrders])

  const filtered =
    filter === 'active'
      ? orders.filter((o) => o.status !== 'completed')
      : filter === 'completed'
        ? orders.filter((o) => o.status === 'completed')
        : orders

  const handleConfirmReceived = async (order: Order) => {
    if (!authToken) return
    setConfirmingId(order.id)
    setConfirmMsg('')
    try {
      await confirmOrderReceived(order.id)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'completed' } : o)))
    } catch (err: any) {
      setConfirmMsg(err.message || 'Gagal konfirmasi')
    } finally {
      setConfirmingId(null)
    }
  }

  const awaitingConfirm = orders.filter(isAwaitingConfirm)
  const awaitingCodes = awaitingConfirm.map((o) => o.id).join(', ')

  return (
    <div>
      <p className="text-zinc-500 text-sm mb-5">{filtered.length} pesanan</p>

      {confirmMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl mb-4">
          {confirmMsg}
        </p>
      )}

      {orders.length > 0 && (
        <div className="flex gap-2 py-2.5 flex-wrap mb-6">
          
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
                filter === s.value
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {awaitingConfirm.length > 0 && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1h2m8 0V6a1 1 0 011-1h2a1 1 0 011 1v14a1 1 0 01-1 1h-2m0 0l-3 3m0 0l-3-3m3 3V6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-800">
                Pesanan kamu lagi dikirim 
              </p>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
                Pesanan <strong className="text-zinc-800">{awaitingCodes}</strong> sudah dalam
                perjalanan menuju kamu. Saat sudah sampai di tangan,{' '}
                <strong className="text-zinc-800">jangan lupa konfirmasi</strong> dengan tekan
                tombol hijau <strong className="text-zinc-800">"Pesanan Sudah Diterima"</strong> di
                kartu pesanan ya, biar pesananmu tercatat sebagai Selesai.
              </p>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-zinc-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          <p className="text-xl text-zinc-400 mb-2">Belum ada pesanan</p>
          <p className="text-zinc-400 mb-6">Ayo belanja dulu!</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-brand-500 rounded-[8px] hover:bg-brand-600 transition-colors"
          >
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending
            const date = new Date(order.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-zinc-100 p-4 md:p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-zinc-400">{date}</p>
                    <p className="font-bold text-zinc-800 text-sm">
                      Pesanan: {order.id}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {order.items.length} produk
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 text-sm">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-[8px] bg-zinc-100"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-[8px] bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-sm shrink-0">
                          {item.product.name.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-zinc-400">x{item.quantity}</p>
                      </div>
                      <span className="font-medium text-zinc-800 whitespace-nowrap">
                        Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                {isAwaitingConfirm(order) && (
                  <div className="border-t border-zinc-100 pt-3 mb-3">
                    <button
                      onClick={() => handleConfirmReceived(order)}
                      disabled={confirmingId === order.id}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 disabled:cursor-not-allowed rounded-xl active:scale-95 transition-all"
                    >
                      {confirmingId === order.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={16} weight="bold" />
                      )}
                      {confirmingId === order.id ? 'Menyimpan...' : 'Pesanan Sudah Diterima'}
                    </button>
                    <p className="text-xs text-zinc-400 mt-2">
                      Tekan tombol ini kalau pesanan sudah sampai di tangan kamu.
                    </p>
                  </div>
                )}

                <div className="border-t border-zinc-100 pt-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    {order.paymentMethod === 'cod' ? 'Bayar di Tempat' : order.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}
                    {' — '}
                    {order.shippingMethod === 'ambil' ? 'Ambil Langsung' : order.shippingMethod === 'gosend' ? 'GoSend' : order.shippingMethod === 'jne' ? 'JNE' : 'J&T'}
                  </p>
                  <p className="font-bold text-brand-600">
                    Rp {order.total.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
