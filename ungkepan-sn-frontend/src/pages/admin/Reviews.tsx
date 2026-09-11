import { useEffect, useState } from 'react'
import { Star, Trash, CheckCircle, XCircle, Funnel } from '@phosphor-icons/react'
import { adminGetReviews, adminToggleReview, adminDeleteReview, getCategories } from '../../api/client'
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal'
import SuccessModal from '../../components/ui/SuccessModal'

interface Review {
  id: number
  product_id: number | null
  product_name: string | null
  category_id: number | null
  category_name: string | null
  name: string
  rating: number
  review: string
  is_approved: number
  created_at: string
}

const filterOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'product', label: 'Ulasan Produk' },
  { value: 'testimonial', label: 'Testimoni Umum' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'pending', label: 'Pending' },
]

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('')

  const fetchReviews = () => {
    setLoading(true)
    Promise.all([
      adminGetReviews(),
      getCategories(),
    ]).then(([revs, cats]) => {
      setReviews((revs as any[]).map((r) => ({
        id: r.id,
        product_id: r.product_id,
        product_name: r.product_name ?? null,
        category_id: r.category_id ?? null,
        category_name: r.category_name ?? null,
        name: r.name,
        rating: r.rating,
        review: r.review,
        is_approved: r.is_approved,
        created_at: r.created_at,
      })))
      setCategories(cats.map((c: any) => ({ id: Number(c.id), name: c.name })))
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReviews() }, [])

  const filtered = reviews.filter((r) => {
    if (filter === 'product') return r.product_id !== null
    if (filter === 'testimonial') return r.product_id === null
    if (filter === 'approved') return r.is_approved === 1
    if (filter === 'pending') return r.is_approved === 0
    return true
  }).filter((r) => {
    if (!catFilter) return true
    return String(r.category_id) === catFilter
  })

  const handleToggle = async (id: number, current: number) => {
    try {
      await adminToggleReview(id, current === 0)
      fetchReviews()
      setSuccess(current === 0 ? 'Review telah disetujui' : 'Review telah ditolak')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = (id: number) => {
    setConfirmDelete(id)
  }

  const handleConfirmDelete = async () => {
    if (confirmDelete === null) return
    try {
      await adminDeleteReview(confirmDelete); fetchReviews(); setConfirmDelete(null)
      setSuccess('Review berhasil dihapus')
    } catch (err: any) {
      setConfirmDelete(null); setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Testimoni & Ulasan</h1>
        <p className="text-zinc-500">{filtered.length} review</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {filterOptions.map((o) => (
          <button
            key={o.value}
            onClick={() => { setFilter(o.value); setCatFilter('') }}
            className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
              filter === o.value
                ? 'bg-[#EA580C] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {o.label}
          </button>
        ))}
        {filter !== 'testimonial' && categories.length > 0 && (
          <div className="relative ml-2">
            <Funnel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm font-semibold bg-white text-zinc-600 rounded-lg border border-black/10 outline-none focus:border-[#F5730C] appearance-none cursor-pointer transition-colors"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={confirmDelete !== null}
        title="Hapus Review"
        message="Yakin ingin menghapus review ini?"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <SuccessModal
        open={success !== null}
        message={success || ''}
        onConfirm={() => setSuccess(null)}
      />

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-zinc-400">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">Belum ada review</div>
      ) : (
        <>
        {/* Kartu (mobile) */}
        <div className="md:hidden space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-zinc-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-zinc-800 text-sm">{r.name}</p>
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      weight={i < r.rating ? 'fill' : 'regular'}
                      className={i < r.rating ? 'text-amber-400' : 'text-zinc-200'}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{r.product_name || '(Testimoni Umum)'}</p>
              <p className="text-[13px] text-zinc-600 leading-relaxed mt-2 line-clamp-3">{r.review}</p>
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-50">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  r.is_approved ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {r.is_approved ? 'Disetujui' : 'Pending'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(r.id, r.is_approved)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                      r.is_approved
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-100'
                        : 'border-green-200 text-green-600 hover:bg-green-100'
                    }`}
                    title={r.is_approved ? 'Tolak' : 'Setujui'}
                  >
                    {r.is_approved ? <XCircle size={15} /> : <CheckCircle size={15} />}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabel (desktop) */}
        <div className="hidden md:block bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Produk</th>
                  <th className="text-center px-4 py-3 font-semibold text-zinc-600">Rating</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 hidden md:table-cell">Review</th>
                  <th className="text-center px-4 py-3 font-semibold text-zinc-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-800">{r.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{r.product_name || '(Testimoni Umum)'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            weight={i < r.rating ? 'fill' : 'regular'}
                            className={i < r.rating ? 'text-amber-400' : 'text-zinc-200'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 max-w-xs truncate hidden md:table-cell">{r.review}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.is_approved ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {r.is_approved ? 'Disetujui' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(r.id, r.is_approved)}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg border border-[#F5730C]/40 text-[#F5730C] hover:bg-[#FFF1E6] transition-colors ${
                            r.is_approved
                              ? 'text-amber-600 hover:bg-amber-100'
                              : 'text-green-600 hover:bg-green-100'
                          }`}
                          title={r.is_approved ? 'Tolak' : 'Setujui'}
                        >
                          {r.is_approved ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                         <button
                        onClick={() => handleDelete(r.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
