import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FloppyDisk, Image, Trash, Plus, CaretUp, CaretDown, UploadSimple, Heart, ShieldCheck, Package, Clock, Leaf, ShoppingBag, Cookie, Coffee, BowlFood, Cake, Storefront } from '@phosphor-icons/react'
import { adminUpdateSiteContent, getSiteContent, adminUploadFile, resolveImage } from '../../api/client'
import Toast from '../../components/ui/Toast'

const DEFAULT_VALUES = [
  { icon: 'Package', title: 'Bahan Segar', desc: 'Bahan pilihan kualitas terbaik, langsung dari pasar tradisional' },
  { icon: 'Clock', title: 'Pesanan Baru', desc: 'Kami buat setelah kamu pesan, bukan stok lama' },
  { icon: 'ShieldCheck', title: 'Bersih & Higienis', desc: 'Dapur bersih standar rumahan, pake sarung tangan' },
  { icon: 'Leaf', title: 'Resep Turun Temurun', desc: 'Rasa autentik yang udah teruji dari generasi ke generasi' },
]

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1200&q=80&auto=format',
  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80&auto=format',
]



export default function HeroContent() {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSiteContent('hero').then((data) => {
      setContent({
        badge: '', headingStart: '', headingBrand: '', description: '',
        images: data?.images?.length ? data.images : [...DEFAULT_IMAGES],
        values: data?.values?.length ? data.values : [...DEFAULT_VALUES],
        ...(data || {}),
      })
    }).catch(() => {
      setContent({ badge: '', headingStart: '', headingBrand: '', description: '', images: [...DEFAULT_IMAGES], values: [...DEFAULT_VALUES] })
    }).finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }))
  }

  const addImage = () => {
    if (!newImageUrl.trim()) return
    setContent((prev: any) => ({
      ...prev,
      images: [...(prev.images || []), newImageUrl.trim()],
    }))
    setNewImageUrl('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await adminUploadFile(file)
      setContent((prev: any) => ({
        ...prev,
        images: [...(prev.images || []), res.url],
      }))
    } catch (err: any) {
      setToast({ visible: true, message: 'Gagal upload: ' + (err.message || ''), type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (idx: number) => {
    setContent((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: string, i: number) => i !== idx),
    }))
  }

  const moveImage = (idx: number, dir: -1 | 1) => {
    const to = idx + dir
    if (to < 0 || to >= (content?.images?.length || 0)) return
    setContent((prev: any) => {
      const imgs = [...prev.images]
      const temp = imgs[idx]
      imgs[idx] = imgs[to]
      imgs[to] = temp
      return { ...prev, images: imgs }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminUpdateSiteContent('hero', content)
      setToast({ visible: true, message: 'Konten hero berhasil disimpan!', type: 'success' })
    } catch (err: any) {
      setToast({ visible: true, message: err.message || 'Gagal menyimpan', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-brand-600 font-medium transition-colors"
      >
        <ArrowLeft size={18} /> Kembali
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Konten Hero</h1>

      {content && (
        <div className="space-y-6">
          {/* Text Content */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Teks Hero</h2>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Badge</label>
              <input
                value={content.badge || ''}
                onChange={(e) => update('badge', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="Jajanan Rumahan Terpercaya"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Judul (sebelah kiri)</label>
              <input
                value={content.headingStart || ''}
                onChange={(e) => update('headingStart', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="Aneka Kue & Minuman"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Judul (bagian brand / highlight)</label>
              <input
                value={content.headingBrand || ''}
                onChange={(e) => update('headingBrand', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="Olahan Ungkepan SN"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Deskripsi</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none resize-none"
                placeholder="Enak, bersih, dan dibuat dengan resep turun-temurun."
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Gambar Slideshow</h2>
            <p className="text-xs text-zinc-400">
              Foto akan tampil sebagai background slideshow di hero. Urutkan sesuai keinginan.
            </p>

            <div className="flex gap-2">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addImage()}
                className="flex-1 px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="https://... URL gambar"
              />
              <button
                onClick={addImage}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-[8px] transition-colors shrink-0"
              >
                <Plus size={18} weight="bold" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs text-zinc-400 font-medium">atau</span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 disabled:bg-zinc-100 disabled:text-zinc-400 rounded-[8px] border-2 border-dashed border-brand-200 hover:border-brand-400 transition-colors"
              >
                <UploadSimple size={18} weight="bold" />
                {uploading ? 'Mengupload...' : 'Upload dari komputer'}
              </button>
            </div>

            <div className="space-y-3">
              {(content.images || []).map((img: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-zinc-200 shrink-0">
                    <img src={resolveImage(img)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <span className="flex-1 text-sm text-zinc-600 truncate min-w-0">{img}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretUp size={14} />
                    </button>
                    <button
                      onClick={() => moveImage(i, 1)}
                      disabled={i === (content.images?.length || 0) - 1}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretDown size={14} />
                    </button>
                    <button
                      onClick={() => removeImage(i)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!content.images || content.images.length === 0) && (
                <p className="text-sm text-zinc-400 text-center py-4">Belum ada gambar. Tambah URL di atas.</p>
              )}
            </div>
          </div>

          {/* Kenapa Pilih Kami */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-zinc-700">Kenapa Pilih Kami</h2>
              <button
                onClick={() => setContent((prev: any) => ({
                  ...prev,
                  values: [...(prev.values || []), { icon: 'Heart', title: '', desc: '' }],
                }))}
                className="text-sm text-brand-600 hover:text-brand-700 font-semibold"
              >
                + Tambah Item
              </button>
            </div>
            <p className="text-xs text-zinc-400">Icon: Heart, ShieldCheck, Package, Clock, Leaf, ShoppingBag, Cookie, Coffee, BowlFood, Cake, Storefront</p>
            {(content.values || []).map((v: any, i: number) => (
              <div key={i} className="p-4 bg-zinc-50 rounded-xl space-y-3 relative">
                <button
                  onClick={() => setContent((prev: any) => ({
                    ...prev,
                    values: prev.values.filter((_: any, j: number) => j !== i),
                  }))}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm font-semibold"
                >
                  Hapus
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">Icon</label>
                    <select
                      value={v.icon || 'Heart'}
                      onChange={(e) => {
                        const vals = [...(content.values || [])]
                        vals[i] = { ...vals[i], icon: e.target.value }
                        setContent((prev: any) => ({ ...prev, values: vals }))
                      }}
                      className="w-full px-3 py-2 text-sm border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                    >
                      <option value="Heart">Heart</option>
                      <option value="ShieldCheck">ShieldCheck</option>
                      <option value="Package">Package</option>
                      <option value="Clock">Clock</option>
                      <option value="Leaf">Leaf</option>
                      <option value="ShoppingBag">ShoppingBag</option>
                      <option value="Cookie">Cookie</option>
                      <option value="Coffee">Coffee</option>
                      <option value="BowlFood">BowlFood</option>
                      <option value="Cake">Cake</option>
                      <option value="Storefront">Storefront</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">Judul</label>
                    <input
                      value={v.title || ''}
                      onChange={(e) => {
                        const vals = [...(content.values || [])]
                        vals[i] = { ...vals[i], title: e.target.value }
                        setContent((prev: any) => ({ ...prev, values: vals }))
                      }}
                      className="w-full px-3 py-2 text-sm border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1">Deskripsi</label>
                  <input
                    value={v.desc || ''}
                    onChange={(e) => {
                      const vals = [...(content.values || [])]
                      vals[i] = { ...vals[i], desc: e.target.value }
                      setContent((prev: any) => ({ ...prev, values: vals }))
                    }}
                    className="w-full px-3 py-2 text-sm border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-300 rounded-[8px] transition-colors"
          >
            <FloppyDisk size={18} weight="bold" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </div>
  )
}
