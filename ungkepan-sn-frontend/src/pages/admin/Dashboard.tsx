import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminGetDashboard } from '../../api/client'

interface DashboardData {
  total_products: number
  total_orders: number
  total_revenue: number
  pending_orders: number
  processed_orders: number
  completed_orders: number
  recent_orders: { order_code: string; customer_name: string; total: number; status: string; created_at: string }[]
  low_stock: { name: string; stock: number }[]
  chart_categories: { name: string; value: number }[]
  monthly_sales: { month: string; value: number }[]
}

const DONUT_COLORS = ['#F5730C', '#B45309', '#F59E0B', '#EA580C', '#D97706']

const statusMeta: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: ' text-amber-600' },
  processed: { label: 'Diproses', badge: 'text-blue-600' },
  shipped: { label: 'Diproses', badge: 'text-blue-600' },
  completed: { label: 'Selesai', badge: 'text-green-600' },
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  const statCards = data ? [
    {
      label: 'Total Produk',
      value: String(data.total_products),
      svg: <path d="M21 8V7l-3-4H6L3 7v1M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8M21 8H3M12 12h4" />,
    },
    {
      label: 'Total Pesanan',
      value: String(data.total_orders),
      svg: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
    },
    {
      label: 'Pendapatan',
      value: `Rp ${data.total_revenue.toLocaleString('id-ID')}`,
      svg: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    },
    {
      label: 'Pending',
      value: String(data.pending_orders),
      svg: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    },
    {
      label: 'Diproses',
      value: String(data.processed_orders),
      svg: <path d="M3 3v18h18M7 15l4-6 3 3 5-8" />,
    },
    {
      label: 'Selesai',
      value: String(data.completed_orders),
      svg: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
    },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-zinc-800">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Dashboard admin toko Ungkepan SN</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3.5 text-sm font-semibold text-red-700">
          {error} — pastikan API PHP sudah jalan di Laragon.
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {statCards.map((k) => (
              <div key={k.label} className="bg-white rounded-2xl p-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5730C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.svg}</svg>
                <p className="mt-4 text-xs text-zinc-400">{k.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-zinc-800">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Charts: Donut + Penjualan Bulanan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-extrabold text-zinc-800">Produk per Kategori</h2>
              {(() => {
                const cats = data.chart_categories
                const total = cats.reduce((s, c) => s + c.value, 0)
                const R = 40
                const C = 2 * Math.PI * R
                let acc = 0
                return total > 0 ? (
                  <div className="mt-5 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-40 h-40 shrink-0">
                      <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
                        <circle cx="50" cy="50" r={R} fill="none" stroke="#F3F1EA" strokeWidth="16" />
                        {cats.map((c, i) => {
                          const frac = c.value / total
                          const len = frac * C
                          const seg = (
                            <circle
                              key={c.name}
                              cx="50"
                              cy="50"
                              r={R}
                              fill="none"
                              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                              strokeWidth="16"
                              strokeDasharray={`${len} ${C - len}`}
                              strokeDashoffset={-acc * C}
                              strokeLinecap="butt"
                            />
                          )
                          acc += frac
                          return seg
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-zinc-800">{total}</span>
                        <span className="text-[11px] text-zinc-400">Produk</span>
                      </div>
                    </div>
                    <ul className="w-full space-y-2.5">
                      {cats.map((c, i) => (
                        <li key={c.name} className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="flex-1 text-sm font-medium text-zinc-700">{c.name}</span>
                          <span className="text-sm font-bold text-zinc-800">{c.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-zinc-400 py-10 text-center">Belum ada produk</p>
                )
              })()}
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-extrabold text-zinc-800">Penjualan Bulanan</h2>
              {(() => {
                const months = data.monthly_sales
                const max = Math.max(1, ...months.map((m) => m.value))
                return (
                  <div className="mt-4 flex gap-1.5 h-44">
                    {months.map((m) => {
                      const h = (m.value / max) * 100
                      return (
                        <div key={m.month} className="flex-1 h-full flex flex-col min-w-0">
                          <div className="h-5 text-center text-[10px] text-zinc-500 font-semibold truncate">
                            {m.value > 0 ? `Rp ${(m.value / 1000).toFixed(0)}rb` : ''}
                          </div>
                          <div className="flex-1 relative">
                            <div className="absolute inset-0 flex items-end rounded-t-md overflow-hidden">
                              <div
                                className={`w-full rounded-t-md ${m.value > 0 ? 'bg-[#F5730C]' : ''}`}
                                style={{ height: `${h}%`, minHeight: m.value > 0 ? 6 : 0 }}
                              />
                            </div>
                          </div>
                          <div className="h-5 pt-1 text-center text-[10px] text-zinc-400 truncate">{m.month}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              <p className="mt-3 text-center text-xs text-zinc-400">Pendapatan 12 bulan terakhir (Rp ribu)</p>
            </div>
          </div>

          {/* Low stock + Recent orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-extrabold text-zinc-800">Stok Menipis</h2>
              {data.low_stock.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <span className="text-[#F5730C]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V7l-3-4H6L3 7v1M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8M21 8H3M12 12h4" /></svg>
                  </span>
                  <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                    Semua stok aman
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {data.low_stock.map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <span className="text-sm font-medium text-zinc-700">{p.name}</span>
                      <span className="text-sm font-bold text-red-500">{p.stock} tersisa</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-zinc-800">Pesanan Terbaru</h2>
                <Link to="/admin/dashboard/orders" className="flex items-center gap-1 text-sm font-semibold text-[#F5730C] hover:text-[#D9600A] transition-colors">
                  Lihat Semua
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
              </div>
              <div className="mt-4 space-y-1">
                {data.recent_orders.length === 0 && (
                  <p className="text-sm text-zinc-400 py-6 text-center">Belum ada pesanan</p>
                )}
                {data.recent_orders.map((o) => (
                  <div key={o.order_code} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-0">
                    <div>
                      <p className="font-semibold text-sm text-zinc-800">{o.customer_name}</p>
                      <p className="text-xs text-zinc-400">{o.order_code}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta[o.status]?.badge || 'bg-zinc-100 text-zinc-600'}`}>
                      {statusMeta[o.status]?.label || o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4">
        <Link to="/admin/dashboard/products" className="group bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
          <span className="w-11 h-11 rounded-xl bg-[#FFF1E6] text-[#F5730C] flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V7l-3-4H6L3 7v1M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8M21 8H3M12 12h4" /></svg>
          </span>
          <span className="flex-1">
            <p className="font-bold text-sm text-zinc-800">Atur Produk</p>
            <p className="text-xs text-zinc-400 mt-0.5">Tambah / edit produk</p>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a69c" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <Link to="/admin/dashboard/orders" className="group bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
          <span className="w-11 h-11 rounded-xl bg-[#FFF1E6] text-[#F5730C] flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6l1 4H8Z" /><rect x="5" y="6" width="14" height="16" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></svg>
          </span>
          <span className="flex-1">
            <p className="font-bold text-sm text-zinc-800">Lihat Pesanan</p>
            <p className="text-xs text-zinc-400 mt-0.5">Update status pesanan</p>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a69c" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      </div>
    </div>
  )
}
