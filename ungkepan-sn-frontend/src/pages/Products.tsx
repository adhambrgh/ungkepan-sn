import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Heart } from '@phosphor-icons/react'
import { getProducts, getCategories } from '../api/client'
import { subscribeStock } from '../lib/stockStream'
import { useAuthStore } from '../store/authStore'
import { useFavoritesStore } from '../store/favoritesStore'
import type { Product, Category } from '../types'
import LoginPrompt from '../components/ui/LoginPrompt'
import AddToCartButton from '../components/product/AddToCartButton'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || ''
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const authToken = useAuthStore((s) => s.token)
  const toggleFavorite = useFavoritesStore((s) => s.toggle)
  const favIds = useFavoritesStore((s) => s.ids)
  const navigate = useNavigate()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [promptProduct, setPromptProduct] = useState<Product | null>(null)

  useEffect(() => {
    getProducts().then(setProducts)
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    return subscribeStock((stocks) => {
      setProducts((prev) =>
        prev.map((p) => (stocks[p.id] !== undefined ? { ...p, stock: stocks[p.id] } : p))
      )
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = products
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory)
    }
    if (q) {
      const catNames = new Set(
        categories.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.id)
      )
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          catNames.has(p.category)
      )
    }
    return result
  }, [activeCategory, search, products, categories])

  const setCategory = (catId: string) => {
    const params: Record<string, string> = {}
    if (catId) params.category = catId
    if (search.trim()) params.search = search.trim()
    if (catId === activeCategory) {
      delete params.category
    }
    setSearchParams(params)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    const params: Record<string, string> = {}
    if (activeCategory) params.category = activeCategory
    if (value.trim()) params.search = value.trim()
    setSearchParams(params)
  }

  // Clean duplicate consecutive words in product names (e.g., "Pepes Pepes" → "Pepes")
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

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Produk</h1>
          <p className="text-zinc-500 text-sm md:text-base">
            {activeCategory
              ? `Kategori: ${categories.find((c) => c.id === activeCategory)?.name}`
              : 'Semua produk Ungkepan SN'}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-base border-2 border-zinc-200 rounded-[8px] focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setCategory('')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
            !activeCategory
              ? 'bg-[#EA580C] text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
          className={`px-5 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#EA580C] text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <img
            src="/keranjangkosong.png"
            alt="Produk tidak ditemukan"
            className="w-48 h-48 object-contain drop-shadow-lg mx-auto mb-6"
          />
          <p className="text-xl text-zinc-400 mb-2">Produk tidak ditemukan</p>
          <p className="text-zinc-400">Coba cari dengan kata kunci lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-[4/3]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="px-4 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full">
                      Stok Habis
                    </span>
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-semibold bg-white/90 text-zinc-700 rounded-full">
                  {product.categoryName || 'Produk'}
                </span>
              </Link>
              <div className="p-3 md:p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="font-bold text-zinc-800 text-sm md:text-base mb-1 line-clamp-1 hover:text-brand-600 transition-colors">
                    {cleanProductName(product.name)}
                  </h3>
                </Link>
                <p className="font-bold text-brand-600 text-base mb-3">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/products/${product.id}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-[8px] transition-colors text-brand-600 border-2 border-brand-600 hover:bg-brand-50 active:bg-brand-100"
                  >
                    Lihat Detail
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!authToken) { setShowLoginPrompt(true); return } toggleFavorite(product.id) }}
                      aria-label="Favorit"
                      className={`flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
                        favIds.includes(product.id)
                          ? 'text-brand-600 border-2 border-brand-600 bg-brand-50'
                          : 'text-zinc-600 border-2 border-zinc-200 hover:border-brand-600 hover:text-brand-600'
                      }`}
                    >
                      <Heart size={16} weight={favIds.includes(product.id) ? 'fill' : 'bold'} />
                      Favorit
                    </button>
                    <AddToCartButton
                      product={product}
                      onRequireLogin={() => { setPromptProduct(product); setShowLoginPrompt(true) }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirect={promptProduct ? `/products/${promptProduct.id}` : '/'}
        context="belanja"
      />
    </>
  )
}
