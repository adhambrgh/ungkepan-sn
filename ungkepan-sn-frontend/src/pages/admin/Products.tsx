import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import { adminGetProducts, adminDeleteProduct, getCategories, adminToggleFeatured, resolveImage } from '../../api/client'
import ConfirmModal from '../../components/ui/ConfirmModal'

interface Product {
  id: number
  category_id: number
  category_name: string
  name: string
  price: number
  image: string
  description: string
  weight: string
  stock: number
  is_featured?: number
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProducts = () => {
    setLoading(true)
    adminGetProducts()
      .then((data: any[]) => setProducts(data.map((p: any) => ({ ...p, image: resolveImage(p.image || '') }))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProducts()
    getCategories()
      .then((cats: any[]) => setCategories(cats.map((c: any) => ({ id: Number(c.id), name: c.name, slug: c.slug || '' }))))
      .catch(() => {})
  }, [])

  const filtered = products.filter((p) => {
    const matchesCat = !filterCat || String(p.category_id) === filterCat
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || p.name.toLowerCase().includes(q)
    return matchesCat && matchesQuery
  })

  const handleToggleFeatured = async (id: number, current: number) => {
    try {
      await adminToggleFeatured(id, current === 0)
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = (id: number, name: string) => {
    setConfirmDelete({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      await adminDeleteProduct(confirmDelete.id); fetchProducts(); setConfirmDelete(null)
    } catch (err: any) {
      setConfirmDelete(null); setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-zinc-800">Produk</h1>
          <p className="mt-1 text-sm text-zinc-500">{filtered.length} produk</p>
        </div>
        <Link
          to="/admin/dashboard/products/tambah"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-[8px] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Tambah
        </Link>
      </div>

      <ConfirmModal
        open={confirmDelete !== null}
        title="Hapus Produk"
        message={`Yakin ingin menghapus produk "${confirmDelete?.name}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="filterKategori" className="text-sm font-semibold text-zinc-600">Filter Kategori:</label>
        <select
          id="filterKategori"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold outline-none focus:border-[#F5730C] transition-colors bg-white"
        >
          <option value="">Semua</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="relative max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a69c" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          id="searchProduct"
          type="search"
          placeholder="Cari produk..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-[#F5730C] transition-colors placeholder:text-zinc-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-zinc-400 text-sm">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-12 text-center text-zinc-400 text-sm">
          <p>{products.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang cocok'}</p>
        </div>
      ) : (
        <>
        {/* Kartu (mobile) */}
        <div className="md:hidden space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-black/5 p-4">
              <div className="flex items-start gap-3">
                <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover bg-zinc-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-800 text-sm leading-snug line-clamp-2">{p.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{p.category_name}</p>
                  <p className="text-[13px] font-bold text-zinc-800 mt-1">
                    Rp {p.price.toLocaleString('id-ID')}
                  </p>
                  <p className={`text-xs font-semibold mt-0.5 ${p.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                    Stok: {p.stock}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(p.id, p.is_featured || 0)}
                    className={`transition-colors ${p.is_featured ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}
                    aria-label={`Tandai ${p.name} sebagai favorit`}
                  >
                    <Star size={20} weight={p.is_featured ? 'fill' : 'regular'} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/admin/dashboard/products/edit/${p.id}`}
                      aria-label={`Edit ${p.name}`}
                      className="w-9 h-9 rounded-lg border border-[#F5730C]/40 text-[#F5730C] flex items-center justify-center hover:bg-[#FFF1E6] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      aria-label={`Hapus ${p.name}`}
                      className="w-9 h-9 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabel (desktop) */}
        <div className="hidden md:block bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-black/5">
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Stok</th>
                  <th className="px-6 py-4">Favorit</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-11 h-11 rounded-lg object-cover bg-zinc-100" />
                        <span className="font-semibold text-zinc-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{p.category_name}</td>
                    <td className="px-6 py-4 font-bold text-zinc-800">Rp {p.price.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${p.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>{p.stock}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleFeatured(p.id, p.is_featured || 0)}
                        className={`transition-colors ${p.is_featured ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}
                        title={p.is_featured ? 'Hapus dari favorit' : 'Jadikan favorit'}
                        aria-label={`Tandai ${p.name} sebagai favorit`}
                      >
                        <Star size={18} weight={p.is_featured ? 'fill' : 'regular'} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/dashboard/products/edit/${p.id}`}
                          aria-label={`Edit ${p.name}`}
                          className="w-8 h-8 rounded-lg border border-[#F5730C]/40 text-[#F5730C] flex items-center justify-center hover:bg-[#FFF1E6] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          aria-label={`Hapus ${p.name}`}
                          className="w-8 h-8 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
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