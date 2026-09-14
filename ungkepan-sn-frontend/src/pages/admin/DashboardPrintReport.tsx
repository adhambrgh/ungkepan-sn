import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminGetDashboard, adminGetDashboardDetail } from '../../api/client'

interface DashboardData {
  total_products: number
  total_orders: number
  total_revenue: number
  pending_orders: number
  processed_orders: number
  shipped_orders: number
  completed_orders: number
  recent_orders: { order_code: string; customer_name: string; total: number; status: string; created_at: string }[]
  low_stock: { name: string; stock: number }[]
  chart_categories: { name: string; value: number }[]
  monthly_sales: { month: string; value: number; orders: number }[]
}

interface ProductDetail {
  product_name: string
  qty: number
  price: number
  revenue: number
}

interface MonthDetail {
  month: string
  year: number
  orders_count: number
  qty: number
  revenue: number
  products: ProductDetail[]
}

interface OutgoingItem {
  date: string
  order_code: string
  product_name: string
  price: number
  quantity: number
  total: number
}

interface DetailData {
  monthly_detail: MonthDetail[]
  outgoing_history: OutgoingItem[]
}

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  processed: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
}

function rupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function DashboardPrintReport() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    adminGetDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
    adminGetDashboardDetail()
      .then(setDetail)
      .catch(() => {})
  }, [])

  const printedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-zinc-100 py-8 print:bg-white print:py-0">
      {/* Print styles: force A4 page size */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm 12mm; }
          body { background: #fff !important; }
          .page-break { page-break-before: always; break-before: page; }
          tr, .keep-together { page-break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar — hidden when printing */}
      <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between px-2 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-700 flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          Kembali
        </button>
        <button
          onClick={() => window.print()}
          disabled={!data}
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          Cetak / Simpan PDF
        </button>
      </div>

      {error && (
        <div className="max-w-[210mm] mx-auto rounded-2xl bg-red-50 border border-red-100 px-5 py-3.5 text-sm font-semibold text-red-700 print:hidden">
          {error} — pastikan API PHP sudah jalan di Laragon.
        </div>
      )}

      {!data && !error && (
        <p className="text-center text-sm text-zinc-400 print:hidden">Memuat data laporan...</p>
      )}

      {data && (
        <>
        <div className="max-w-[210mm] mx-auto bg-white shadow-sm print:shadow-none p-10 print:p-0 text-zinc-800 text-[12px] leading-snug">
          {/* Header */}
          <header className="flex items-start justify-between border-b-2 border-zinc-800 pb-3 mb-5">
            <div>
              <h1 className="text-lg font-extrabold">Laporan Penjualan &amp; Ringkasan Toko</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Ungkepan SN &middot; Dicetak {printedAt}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Ungkepan SN</p>
              <p className="text-[11px] text-zinc-500">Laporan Internal Admin</p>
            </div>
          </header>

          {/* Summary cards */}
          <section className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Produk', value: String(data.total_products) },
              { label: 'Total Pesanan', value: String(data.total_orders) },
              { label: 'Total Pendapatan', value: rupiah(data.total_revenue) },
              { label: 'Stok Menipis', value: String(data.low_stock.length) },
            ].map((c) => (
              <div key={c.label} className="border border-zinc-200 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">{c.label}</p>
                <p className="text-base font-extrabold mt-1">{c.value}</p>
              </div>
            ))}
          </section>

          {/* Status pesanan */}
          <section className="mb-6">
            <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Status Pesanan</h2>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="border border-zinc-200 p-1.5 text-left">Menunggu</th>
                  <th className="border border-zinc-200 p-1.5 text-left">Diproses</th>
                  <th className="border border-zinc-200 p-1.5 text-left">Dikirim</th>
                  <th className="border border-zinc-200 p-1.5 text-left">Selesai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-200 p-1.5">{data.pending_orders}</td>
                  <td className="border border-zinc-200 p-1.5">{data.processed_orders}</td>
                  <td className="border border-zinc-200 p-1.5">{data.shipped_orders}</td>
                  <td className="border border-zinc-200 p-1.5">{data.completed_orders}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Pesanan terbaru + stok menipis */}
          <section className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">5 Pesanan Terbaru</h2>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="border border-zinc-200 p-1.5 text-left">Kode</th>
                    <th className="border border-zinc-200 p-1.5 text-left">Pelanggan</th>
                    <th className="border border-zinc-200 p-1.5 text-left">Total</th>
                    <th className="border border-zinc-200 p-1.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.length === 0 ? (
                    <tr><td colSpan={4} className="border border-zinc-200 p-1.5 text-zinc-400">Belum ada pesanan.</td></tr>
                  ) : data.recent_orders.map((o) => (
                    <tr key={o.order_code}>
                      <td className="border border-zinc-200 p-1.5">{o.order_code}</td>
                      <td className="border border-zinc-200 p-1.5">{o.customer_name}</td>
                      <td className="border border-zinc-200 p-1.5">{rupiah(o.total)}</td>
                      <td className="border border-zinc-200 p-1.5">{statusLabel[o.status] || o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Produk Stok Menipis</h2>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="border border-zinc-200 p-1.5 text-left">Nama Produk</th>
                    <th className="border border-zinc-200 p-1.5 text-left">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock.length === 0 ? (
                    <tr><td colSpan={2} className="border border-zinc-200 p-1.5 text-zinc-400">Semua stok aman.</td></tr>
                  ) : data.low_stock.map((p) => (
                    <tr key={p.name}>
                      <td className="border border-zinc-200 p-1.5">{p.name}</td>
                      <td className="border border-zinc-200 p-1.5">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Kategori + penjualan bulanan */}
          <section className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Produk per Kategori</h2>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="border border-zinc-200 p-1.5 text-left">Kategori</th>
                    <th className="border border-zinc-200 p-1.5 text-left">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chart_categories.map((c) => (
                    <tr key={c.name}>
                      <td className="border border-zinc-200 p-1.5">{c.name}</td>
                      <td className="border border-zinc-200 p-1.5">{c.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Penjualan Bulanan</h2>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="border border-zinc-200 p-1.5 text-left">Bulan</th>
                    <th className="border border-zinc-200 p-1.5 text-left">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly_sales.map((m) => (
                    <tr key={m.month}>
                      <td className="border border-zinc-200 p-1.5">{m.month}</td>
                      <td className="border border-zinc-200 p-1.5">{rupiah(m.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="flex justify-between border-t border-zinc-200 pt-2 mt-6 text-[10px] text-zinc-400">
            <span>Laporan dibuat otomatis dari sistem admin Ungkepan SN</span>
            <span>Halaman 1 dari 2</span>
          </footer>
        </div>

        {/* ═══════════════════════ Halaman 2 — Laporan Per Bulan ═══════════════════════ */}
        <div className="page-break max-w-[210mm] mx-auto bg-white shadow-sm print:shadow-none p-10 print:p-0 mt-8 print:mt-0">
          <header className="flex items-start justify-between border-b-2 border-zinc-800 pb-3 mb-5">
            <div>
              <h1 className="text-lg font-extrabold">Laporan Penjualan Per Bulan</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Ungkepan SN &middot; Dicetak {printedAt}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Ungkepan SN</p>
              <p className="text-[11px] text-zinc-500">Laporan Internal Admin</p>
            </div>
          </header>

          {!detail && (
            <p className="text-[11px] text-zinc-400">Detail bulanan tidak tersedia.</p>
          )}

          {detail && (
            <>
              {/* Kartu ringkasan */}
              <section className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Pendapatan', value: rupiah(detail.monthly_detail.reduce((s, m) => s + m.revenue, 0)) },
                  { label: 'Produk Terjual', value: String(detail.monthly_detail.reduce((s, m) => s + m.qty, 0)) },
                  { label: 'Total Pesanan', value: String(detail.monthly_detail.reduce((s, m) => s + m.orders_count, 0)) },
                  { label: 'Bulan Aktif', value: String(detail.monthly_detail.filter((m) => m.qty > 0).length) },
                ].map((c) => (
                  <div key={c.label} className="border border-zinc-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">{c.label}</p>
                    <p className="text-base font-extrabold mt-1">{c.value}</p>
                  </div>
                ))}
              </section>

              {/* Ringkasan + pembelian per produk */}
              <section className="grid grid-cols-2 gap-5 mb-6">
                <div>
                  <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Ringkasan Penjualan per Bulan</h2>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-zinc-100">
                        <th className="border border-zinc-200 p-1.5 text-left">Bulan</th>
                        <th className="border border-zinc-200 p-1.5 text-left">Pesanan</th>
                        <th className="border border-zinc-200 p-1.5 text-left">Produk</th>
                        <th className="border border-zinc-200 p-1.5 text-right">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.monthly_detail.filter((m) => m.qty > 0).map((m) => (
                        <tr key={`${m.month}-${m.year}`}>
                          <td className="border border-zinc-200 p-1.5">{m.month} {m.year}</td>
                          <td className="border border-zinc-200 p-1.5">{m.orders_count}</td>
                          <td className="border border-zinc-200 p-1.5">{m.qty}</td>
                          <td className="border border-zinc-200 p-1.5 text-right">{rupiah(m.revenue)}</td>
                        </tr>
                      ))}
                      {detail.monthly_detail.filter((m) => m.qty > 0).length === 0 && (
                        <tr><td colSpan={4} className="border border-zinc-200 p-1.5 text-zinc-400">Tidak ada penjualan 12 bulan terakhir.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Pembelian per Produk per Bulan</h2>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-zinc-100">
                        <th className="border border-zinc-200 p-1.5 text-left">Bulan</th>
                        <th className="border border-zinc-200 p-1.5 text-left">Produk</th>
                        <th className="border border-zinc-200 p-1.5 text-right">Jml</th>
                        <th className="border border-zinc-200 p-1.5 text-right">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.monthly_detail.filter((m) => m.products.length > 0).map((m) =>
                        m.products.map((p, pi) => (
                          <tr key={`${m.month}-${m.year}-${p.product_name}`}>
                            {pi === 0 && (
                              <td rowSpan={m.products.length} className="border border-zinc-200 p-1.5 font-semibold">{m.month} {m.year}</td>
                            )}
                            <td className="border border-zinc-200 p-1.5">{p.product_name}</td>
                            <td className="border border-zinc-200 p-1.5 text-right">{p.qty}</td>
                            <td className="border border-zinc-200 p-1.5 text-right">{rupiah(p.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Riwayat keluar */}
              {detail.outgoing_history.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-[13px] font-bold border-l-4 border-zinc-800 pl-2 mb-2">Riwayat Keluar Semua Produk</h2>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-zinc-100">
                        <th className="border border-zinc-200 p-1.5 text-left">Tanggal</th>
                        <th className="border border-zinc-200 p-1.5 text-left">Kode Pesanan</th>
                        <th className="border border-zinc-200 p-1.5 text-left">Produk</th>
                        <th className="border border-zinc-200 p-1.5 text-right">Jml</th>
                        <th className="border border-zinc-200 p-1.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.outgoing_history.map((o) => (
                        <tr key={`${o.order_code}-${o.product_name}-${o.date}`}>
                          <td className="border border-zinc-200 p-1.5">{new Date(o.date).toLocaleDateString('id-ID')}</td>
                          <td className="border border-zinc-200 p-1.5">{o.order_code}</td>
                          <td className="border border-zinc-200 p-1.5">{o.product_name}</td>
                          <td className="border border-zinc-200 p-1.5 text-right">{o.quantity}</td>
                          <td className="border border-zinc-200 p-1.5 text-right">{rupiah(o.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-zinc-100 font-bold">
                        <td colSpan={3} className="border border-zinc-200 p-1.5">Total ({detail.outgoing_history.length} item)</td>
                        <td className="border border-zinc-200 p-1.5 text-right">{detail.outgoing_history.reduce((s, o) => s + o.quantity, 0)}</td>
                        <td className="border border-zinc-200 p-1.5 text-right">{rupiah(detail.outgoing_history.reduce((s, o) => s + o.total, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}

          <footer className="flex justify-between border-t border-zinc-200 pt-2 mt-6 text-[10px] text-zinc-400">
            <span>Laporan dibuat otomatis dari sistem admin Ungkepan SN</span>
            <span>Halaman 2 dari 2</span>
          </footer>
        </div>
        </>
      )}
    </div>
  )
}