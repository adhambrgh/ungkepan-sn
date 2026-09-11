import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Heart, SpinnerGap, MagnifyingGlass } from '@phosphor-icons/react'
import { getProducts, getCategories } from '../api/client'
import type { Product, Category } from '../types'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useFavoritesStore } from '../store/favoritesStore'
import LoginPrompt from '../components/ui/LoginPrompt'

export default function Favorites() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [promptProduct, setPromptProduct] = useState<Product | null>(null)
  const ids = useFavoritesStore((s) => s.ids)
  const toggleFavorite = useFavoritesStore((s) => s.toggle)
  const { addItem } = useCartStore()
  const authToken = useAuthStore((s) => s.token)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const cleanProductName = (name: string): string => {
    const words = name.split(' ')
    const cleaned: string[] = []
    words.forEach((word) => {
      if (cleaned.length === 0 || cleaned[cleaned.length - 1].toLowerCase() !== word.toLowerCase()) {
        cleaned.push(word)
      }
    })
    return cleaned.join(' ')
  }

  const favProducts = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))

  const filtered = favProducts.filter((p) => {
    const matchCat = !activeCategory || p.category === activeCategory
    const q = search.trim().toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const handleQuickAdd = (p: Product) => {
    if (!authToken) {
      setPromptProduct(p)
      setShowLoginPrompt(true)
      return
    }
    addItem(p)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-800 leading-tight">
            Menu Favorit Saya
          </h1>
          <p className="text-zinc-500 text-sm md:text-base mt-2">
            Daftar masakan pilihan yang siap menghangatkan meja makan Anda.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Cari produk favorit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-base border-2 border-zinc-200 rounded-[8px] focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
            !activeCategory ? 'bg-[#EA580C] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
              activeCategory === cat.id ? 'bg-[#EA580C] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid / Empty */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <SpinnerGap size={28} className="animate-spin text-brand-600" />
        </div>
      ) : favProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-48 h-48 mb-8">
            <img
              src="/favoritkosong.png"
              alt="Menu favorit kosong"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-3">Wah, Favoritmu Kosong!</h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
            Sepertinya kamu belum menambahkan menu favorit. Jelajahi koleksi masakan
            terbaik kami dan temukan rasa yang cocok di hati.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] rounded-[8px] transition-colors"
          >
            Mulai Belanja Sekarang
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-48 h-48 mb-8">
            <img
              src="/favoritkosong.png"
              alt="Tidak ditemukan"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-3">Tidak ditemukan</h2>
          <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
            Tidak ada favorit yang cocok dengan kata kunci atau kategori yang kamu pilih.
            Coba cari dengan kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <Link to={`/products/${p.id}`} className="block relative overflow-hidden aspect-[4/3]">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {p.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="px-4 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full">
                      Stok Habis
                    </span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-semibold bg-white/90 text-zinc-700 rounded-full">
                  {p.categoryName || 'Produk'}
                </span>
              </Link>
              <div className="p-3 md:p-4">
                <Link to={`/products/${p.id}`}>
                  <h3 className="font-bold text-zinc-800 text-sm md:text-base mb-1 line-clamp-1 hover:text-brand-600 transition-colors">
                    {cleanProductName(p.name)}
                  </h3>
                </Link>
                <p className="font-bold text-brand-600 text-base mb-3">
                  Rp {p.price.toLocaleString('id-ID')}
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/products/${p.id}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-[8px] transition-colors text-brand-600 border-2 border-brand-600 hover:bg-brand-50 active:bg-brand-100"
                  >
                    Lihat Detail
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      aria-label="Favorit"
                      className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
                        ids.includes(p.id)
                          ? 'text-brand-600 border-2 border-brand-600 bg-brand-50'
                          : 'text-zinc-600 border-2 border-zinc-200 hover:border-brand-600 hover:text-brand-600'
                      }`}
                    >
                      <Heart size={16} weight={ids.includes(p.id) ? 'fill' : 'bold'} />
                      Favorit
                    </button>
                    <button
                      onClick={() => handleQuickAdd(p)}
                      disabled={p.stock === 0}
                      className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-[8px] transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800"
                    >
                      <ShoppingCart size={16} weight="bold" />
                      Keranjang
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirect={promptProduct ? `/products/${promptProduct.id}` : '/'}
        context="belanja"
      />
    </main>
  )
}