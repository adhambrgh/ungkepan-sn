import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, FloppyDisk, Image, UploadSimple, Plus, Trash } from '@phosphor-icons/react'
import { adminCreateProduct, adminUpdateProduct, adminGetProducts, getCategories, resolveImage } from '../../api/client'
import Toast from '../../components/ui/Toast'

interface Category {
  id: number | string
  name: string
}

type ImageMode = 'url' | 'upload'

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    category_id: 1,
    name: '',
    price: 0,
    image: '',
    description: '',
    weight: '',
    stock: 0,
  })
  const [paragraphs, setParagraphs] = useState<string[]>([''])
  const [servingSteps, setServingSteps] = useState<{ title: string; description: string }[]>([
    { title: '', description: '' },
  ])
  const [imageMode, setImageMode] = useState<ImageMode>('url')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})

    if (isEdit && id) {
      adminGetProducts().then((products) => {
        const product = products.find((p: any) => p.id === Number(id))
        if (product) {
          setForm({
            category_id: product.category_id,
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description,
            weight: product.weight,
            stock: product.stock,
          })
          setParagraphs((product.description || '').split(/\n{2,}/).filter(Boolean))
          setServingSteps(
            product.serving_steps?.length
              ? product.serving_steps.map((s: any) => ({ title: s.title, description: s.description || '' }))
              : [{ title: '', description: '' }],
          )
          if (product.image && !product.image.startsWith('uploads/')) {
            setImageMode('url')
          } else if (product.image) {
            setImageMode('upload')
          }
        }
      }).catch(() => setError('Gagal memuat produk'))
    }
  }, [id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...form,
        description: paragraphs.map((p) => p.trim()).filter(Boolean).join('\n\n'),
        serving_steps: servingSteps
          .map((s) => ({ title: s.title.trim(), description: s.description.trim() }))
          .filter((s) => s.title),
        image: imageMode === 'url' ? form.image : '',
        imageFile: imageMode === 'upload' ? imageFile : null,
      }

      if (isEdit && id) {
        await adminUpdateProduct({ id: Number(id), ...payload })
      } else {
        await adminCreateProduct(payload)
      }

      setToast({
        visible: true,
        message: isEdit ? 'Perubahan produk berhasil disimpan!' : 'Produk berhasil ditambahkan!',
        type: 'success',
      })
      setTimeout(() => navigate('/admin/dashboard/products'), 2000)
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk')
      setToast({ visible: true, message: err.message || 'Gagal menyimpan produk', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/dashboard/products"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand-600 font-medium transition-colors"
      >
        <ArrowLeft size={18} /> Kembali
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">
        {isEdit ? 'Edit Produk' : 'Tambah Produk'}
      </h1>

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">Kategori</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
            className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">Nama Produk</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Harga (Rp)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Stok</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
              required
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">Berat</label>
          <input
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
            placeholder="500 gram"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">Gambar</label>
          <div className="flex gap-1 mb-3 bg-zinc-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                imageMode === 'url' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Image size={16} /> URL
            </button>
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                imageMode === 'upload' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <UploadSimple size={16} /> Upload File
            </button>
          </div>

          {imageMode === 'url' ? (
            <div className="flex gap-3">
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="flex-1 px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="https://..."
              />
              {form.image && (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="max-h-32 rounded-lg object-cover" />
                ) : form.image && form.image.startsWith('uploads/') ? (
                  <img src={resolveImage(form.image)} alt="preview" className="max-h-32 rounded-lg object-cover" />
                ) : (
                  <>
                    <UploadSimple size={32} className="text-zinc-300" />
                    <p className="text-sm text-zinc-400">Klik untuk pilih file gambar</p>
                    <p className="text-xs text-zinc-300">JPG, PNG, WebP, GIF, SVG</p>
                  </>
                )}
              </div>
              {imageFile && (
                <p className="text-xs text-zinc-500 mt-1">{imageFile.name}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">
            Deskripsi <span className="text-zinc-400 font-normal">(satu kolom per paragraf)</span>
          </label>
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 w-6 text-right">{i + 1}.</span>
                  <textarea
                    value={p}
                    onChange={(e) => {
                      const next = [...paragraphs]
                      next[i] = e.target.value
                      setParagraphs(next)
                    }}
                    rows={3}
                    className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none resize-y"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setParagraphs(paragraphs.filter((_, j) => j !== i))}
                  className="mt-2 p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Hapus paragraf"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setParagraphs([...paragraphs, ''])}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-600 border-2 border-dashed border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <Plus size={16} weight="bold" /> Tambah Paragraf
          </button>
          {paragraphs.length === 1 && paragraphs[0].trim() === '' && (
            <p className="text-xs text-zinc-400 mt-1">Contoh: tulis paragraf pertama di sini, lalu tambah paragraf berikutnya.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">
            Tutorial Penyajian <span className="text-zinc-400 font-normal">(opsional, urut sesuai langkah)</span>
          </label>
          <div className="space-y-3">
            {servingSteps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-3 text-xs font-bold text-zinc-400 w-6 text-right">{i + 1}.</span>
                <div className="flex-1 space-y-2">
                  <input
                    value={step.title}
                    onChange={(e) => {
                      const next = [...servingSteps]
                      next[i] = { ...next[i], title: e.target.value }
                      setServingSteps(next)
                    }}
                    placeholder="Judul langkah, contoh: Kukus dulu 10 menit"
                    className="w-full px-4 py-2.5 text-sm border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) => {
                      const next = [...servingSteps]
                      next[i] = { ...next[i], description: e.target.value }
                      setServingSteps(next)
                    }}
                    rows={2}
                    placeholder="Penjelasan singkat langkah ini (opsional)"
                    className="w-full px-4 py-2.5 text-sm border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none resize-y"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setServingSteps(servingSteps.filter((_, j) => j !== i))}
                  className="mt-2 p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Hapus langkah"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setServingSteps([...servingSteps, { title: '', description: '' }])}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-600 border-2 border-dashed border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <Plus size={16} weight="bold" /> Tambah Langkah
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-300 rounded-[8px] transition-colors"
        >
          <FloppyDisk size={18} weight="bold" />
          {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
        </button>
      </form>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  )
}
