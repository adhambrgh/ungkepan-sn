import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MagnifyingGlass } from '@phosphor-icons/react'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { getMyOrders, confirmOrderReceived, getProducts } from '../api/client'
import { isAwaitingConfirm } from '../utils/orderStatus'
import type { Order, CartItem, Product } from '../types'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Konfirmasi', color: 'text-amber-500' },
  processed: { label: 'Diproses', color: 'text-blue-500' },
  shipped: { label: 'Dikirim', color: 'text-orange-500' },
  completed: { label: 'Selesai', color: 'text-green-500' },
}

const statusFilters = [
  { value: '', label: 'Semua' },
  { value: 'processed', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
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
  const [search, setSearch] = useState('')
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
            setOrders(serverOrders)
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

  const q = search.trim().toLowerCase()
  const filteredBase =
    filter === 'processed'
      ? orders.filter((o) => o.status === 'processed')
      : filter === 'shipped'
        ? orders.filter((o) => o.status === 'shipped')
        : filter === 'completed'
          ? orders.filter((o) => o.status === 'completed')
          : orders

  const filtered = q
    ? filteredBase.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.items.some((i) => i.product.name.toLowerCase().includes(q)),
      )
    : filteredBase

  const handleConfirmReceived = async (order: Order) => {
    if (!authToken) return
    setConfirmingId(order.id)
    setConfirmMsg('')
    try {
      await confirmOrderReceived(order.id)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'completed' } : o)))
      const prev = useCartStore.getState().activeOrdersCount
      useCartStore.getState().setActiveOrdersCount(Math.max(0, prev - 1))
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
        <div className="flex flex-col md:flex-row md:items-center gap-3 py-2.5 mb-6">
          <div className="flex gap-2 flex-wrap">
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
          <div className="relative md:ml-auto">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pesanan..."
              className="w-full md:w-56 pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] transition-colors"
            />
          </div>
        </div>
      )}

      {awaitingConfirm.length > 0 && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 md:p-5">
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
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-48 h-48 mb-8">
            <img
              src="/keranjangkosong.png"
              alt="Belum ada pesanan"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-3">Belum Ada Pesanan</h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
            Ayo belanja dulu! Jelajahi koleksi masakan terbaik kami yang menggugah selera.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-2.5 text-base font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors"
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
                    {order.shippingMethod === 'ambil' ? 'Ambil Langsung' : order.shippingMethod === 'lokal' ? 'Lokal' : order.shippingMethod === 'gosend' ? 'GoSend' : order.shippingMethod === 'jne' ? 'JNE' : order.shippingMethod === 'jnt' ? 'J&T' : order.shippingMethod}
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
