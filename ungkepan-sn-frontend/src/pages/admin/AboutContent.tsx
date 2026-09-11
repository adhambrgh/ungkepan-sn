import { useEffect, useRef, useState } from 'react'
import { FloppyDisk, Image as ImageIcon, UploadSimple } from '@phosphor-icons/react'
import { adminUpdateSiteContent, adminUploadFile, getSiteContent, resolveImage } from '../../api/client'
import Toast from '../../components/ui/Toast'
import SuccessModal from '../../components/ui/SuccessModal'

const inputCls =
  'w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors'

const ICON_OPTIONS = [
  'Heart',
  'ShieldCheck',
  'ShoppingBag',
  'Package',
  'Truck',
  'Star',
  'Cookie',
  'Coffee',
  'BowlFood',
  'Cake',
  'Clock',
  'Storefront',
]

const DEFAULT_CONTENT = {
  title: 'Tentang Kami',
  hero_image: '/hero-about.jpg',
  story_image: '/logo.png',
  hero_subtitle:
    'Kami menghadirkan olahan ungkepan siap saji yang mempermudah hidangan sehari-hari',
  hero_desc:
    'Ungkepan SN menyediakan berbagai lauk ungkepan tradisional yang sudah matang sempurna tinggal panaskan dan santap. Resep warisan keluarga, bahan segar, tanpa pengawet, cocok untuk keluarga sibuk yang tetap ingin makan enak bergizi.',
  hero_button: 'Lihat Produk Kami',
  story_title: 'Sejarah Ungkepan SN',
  story_subtitle: 'Dari dapur kecil dengan resep warisan, kini hadir untuk keluarga Indonesia',
  storyParagraphs: [
    'Ungkepan SN lahir dari keinginan sederhana: ingin keluarga Indonesia bisa menikmati lauk tradisional favorit tanpa repot memasak dari nol. Dimulai dari dapur kecil dengan resep warisan nenek, kini kami menghadirkan berbagai varian ungkepan yang sudah dimasak sampai empuk meresap tinggal panaskan dan santap.',
    'Setiap lauk dimasak dengan teknik ungkep tradisional hingga bumbu meresap ke tulang, lalu dikemas dengan standar kebersihan tertinggi. Dari dapur kecil, kini Ungkepan SN melayani pelanggan dari berbagai kota yang menginginkan lauk enak, bergizi, dan praktis.',
  ],
  values_title: 'Mengapa Pilih Ungkepan SN?',
  values: [
    { icon: 'Heart', title: 'Resep Rahasia Tersendiri', desc: 'Bumbu tradisional khas nusantara, empuk meresap tanpa pengawet' },
    { icon: 'ShieldCheck', title: 'Siap Saji Dalam Hitungan Menit', desc: 'Tinggal panaskan 10-15 menit di microwave, rice cooker, atau wajan' },
    { icon: 'Package', title: 'Bersih, Higienis, Tanpa Pengawet', desc: 'Dapur bersertifikat, bahan segar harian' },
  ],
  checklist: [
    'Lauk tradisional favorit: ayam ungkep, ikan bakar, pepes, usus, dll',
    'Bumbu meresap sempurna tidak perlu tambah garam/bumbu lagi',
    'Bisa disimpan lama di kulkas/freezer, stok lauk siap saji',
    'Hemat waktu & tenaga cocok untuk keluarga sibuk & kos-kosan',
    'Harga terjangkau, porsi pas untuk 1-2 orang makan',
  ],
  cta_title: 'Siap untuk Memasak Lebih Mudah?',
  cta_desc:
    'Dengan membeli produk kami, memasak bukanlah menjadi hal yang sulit, kalian bisa memasak instan dengan suka cita rasa khas indonesia',
  cta_button: 'Mulai Pesan',
}

function ImageField({
  label,
  value,
  onChange,
  onError,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onError: (message: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await adminUploadFile(file)
      onChange(res.url)
    } catch (err: any) {
      onError('Gagal upload: ' + (err.message || ''))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-bold">{label}</label>

      {value && (
        <div className="mt-2 rounded-xl overflow-hidden border border-zinc-200">
          <img
            src={resolveImage(value)}
            alt={label}
            className="w-full h-44 object-cover"
          />
        </div>
      )}

      <div className={`flex items-center gap-3 ${value ? 'mt-3' : 'mt-2'}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={handleUpload}
          className="hidden"
          id={label}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 transition-colors shrink-0"
        >
          <UploadSimple size={16} weight="bold" className="text-brand-600" />
          {uploading ? 'Mengupload...' : value ? 'Ganti' : 'Upload'}
        </button>
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Atau tempel URL gambar di sini"
        className={`mt-3 ${inputCls}`}
      />
    </div>
  )
}

export default function AboutContent() {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    getSiteContent('about').then((data) => {
      if (data) {
        setContent({
          ...DEFAULT_CONTENT,
          ...data,
          storyParagraphs: data.storyParagraphs?.length ? data.storyParagraphs : DEFAULT_CONTENT.storyParagraphs,
          values: data.values?.length ? data.values : DEFAULT_CONTENT.values,
          checklist: data.checklist?.length ? data.checklist : DEFAULT_CONTENT.checklist,
        })
      } else {
        setContent({ ...DEFAULT_CONTENT })
      }
    }).catch(() => setContent({ ...DEFAULT_CONTENT })).finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }))
  }

  const updatePar = (idx: number, val: string) => {
    setContent((prev: any) => {
      const pars = [...(prev.storyParagraphs || [])]
      pars[idx] = val
      return { ...prev, storyParagraphs: pars }
    })
  }

  const addPar = () => {
    setContent((prev: any) => ({
      ...prev,
      storyParagraphs: [...(prev.storyParagraphs || []), ''],
    }))
  }

  const removePar = (idx: number) => {
    setContent((prev: any) => ({
      ...prev,
      storyParagraphs: prev.storyParagraphs.filter((_: any, i: number) => i !== idx),
    }))
  }

  const updateValue = (idx: number, field: string, val: string) => {
    setContent((prev: any) => {
      const values = [...(prev.values || [])]
      values[idx] = { ...values[idx], [field]: val }
      return { ...prev, values }
    })
  }

  const addValue = () => {
    setContent((prev: any) => ({
      ...prev,
      values: [...(prev.values || []), { icon: 'Heart', title: '', desc: '' }],
    }))
  }

  const removeValue = (idx: number) => {
    setContent((prev: any) => ({
      ...prev,
      values: prev.values.filter((_: any, i: number) => i !== idx),
    }))
  }

  const updateCheck = (idx: number, val: string) => {
    setContent((prev: any) => {
      const items = [...(prev.checklist || [])]
      items[idx] = val
      return { ...prev, checklist: items }
    })
  }

  const addCheck = () => {
    setContent((prev: any) => ({
      ...prev,
      checklist: [...(prev.checklist || []), ''],
    }))
  }

  const removeCheck = (idx: number) => {
    setContent((prev: any) => ({
      ...prev,
      checklist: prev.checklist.filter((_: any, i: number) => i !== idx),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminUpdateSiteContent('about', content)
      setSuccess('Konten Tentang Kami berhasil disimpan!')
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
    <div className="space-y-6">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <SuccessModal
        open={success !== null}
        message={success || ''}
        onConfirm={() => setSuccess(null)}
      />

      <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-zinc-800">Konten Tentang Kami</h1>

      {content && (
        <div className="space-y-6">
          {/* Judul Halaman */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold">Judul Halaman</label>
              <input
                value={content.title || ''}
                onChange={(e) => update('title', e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>
          </div>

          {/* Hero */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Hero</h2>
            <div>
              <label className="block text-sm font-bold">Subtitle Utama</label>
              <textarea
                rows={2}
                value={content.hero_subtitle || ''}
                onChange={(e) => update('hero_subtitle', e.target.value)}
                className={`mt-2 ${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-bold">Deskripsi</label>
              <textarea
                rows={3}
                value={content.hero_desc || ''}
                onChange={(e) => update('hero_desc', e.target.value)}
                className={`mt-2 ${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-bold">Teks Tombol</label>
              <input
                value={content.hero_button || ''}
                onChange={(e) => update('hero_button', e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>
          </div>

          {/* Gambar */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500 flex items-center gap-2">
              <ImageIcon size={14} /> Gambar
            </h2>
            <ImageField
              label="Gambar Hero"
              value={content.hero_image || ''}
              onChange={(v) => update('hero_image', v)}
              onError={(msg) => setToast({ visible: true, message: msg, type: 'error' })}
            />
            <div className="border-t border-zinc-100 pt-5">
              <ImageField
                label="Gambar Sejarah / Logo"
                value={content.story_image || ''}
                onChange={(v) => update('story_image', v)}
                onError={(msg) => setToast({ visible: true, message: msg, type: 'error' })}
              />
            </div>
          </div>

          {/* Sejarah / Cerita */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Sejarah / Cerita</h2>
            <div>
              <label className="block text-sm font-bold">Judul Bagian</label>
              <input
                value={content.story_title || ''}
                onChange={(e) => update('story_title', e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-sm font-bold">Subtitle</label>
              <textarea
                rows={2}
                value={content.story_subtitle || ''}
                onChange={(e) => update('story_subtitle', e.target.value)}
                className={`mt-2 ${inputCls} resize-none`}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Paragraf</h3>
              <button
                type="button"
                onClick={addPar}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                + Tambah Paragraf
              </button>
            </div>
            <div className="space-y-4">
              {(content.storyParagraphs || []).map((par: string, i: number) => (
                <div key={i} className="relative">
                  <textarea
                    rows={3}
                    value={par}
                    onChange={(e) => updatePar(i, e.target.value)}
                    className={`w-full rounded-xl border border-zinc-200 px-4 py-3 pr-16 text-sm outline-none focus:border-brand-500 transition-colors resize-none`}
                  />
                  <button
                    type="button"
                    onClick={() => removePar(i)}
                    className="absolute top-3 right-4 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Nilai / Value */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Mengapa Pilih / Nilai</h2>
            <div>
              <label className="block text-sm font-bold">Judul Bagian</label>
              <input
                value={content.values_title || ''}
                onChange={(e) => update('values_title', e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Nilai / Value</h3>
              <button
                type="button"
                onClick={addValue}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                + Tambah Value
              </button>
            </div>
            <div className="space-y-6">
              {(content.values || []).map((v: any, i: number) => (
                <div key={i} className="pb-6 border-b border-zinc-100 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500">Icon</label>
                      <select
                        value={v.icon || 'Heart'}
                        onChange={(e) => updateValue(i, 'icon', e.target.value)}
                        className={`mt-2 ${inputCls} bg-white`}
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500">Judul</label>
                      <input
                        value={v.title || ''}
                        onChange={(e) => updateValue(i, 'title', e.target.value)}
                        className={`mt-2 ${inputCls}`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-zinc-500">Deskripsi</label>
                    <input
                      value={v.desc || ''}
                      onChange={(e) => updateValue(i, 'desc', e.target.value)}
                      className={`mt-2 ${inputCls}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeValue(i)}
                    className="mt-3 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Hapus Value
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Checklist Keunggulan</h2>
              <button
                type="button"
                onClick={addCheck}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                + Tambah Item
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {(content.checklist || []).map((item: string, i: number) => (
                <div key={i} className="relative">
                  <input
                    value={item}
                    onChange={(e) => updateCheck(i, e.target.value)}
                    className={`w-full rounded-xl border border-zinc-200 px-4 py-3 pr-16 text-sm outline-none focus:border-brand-500 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => removeCheck(i)}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">CTA / Penutup</h2>
            <div>
              <label className="block text-sm font-bold">Judul</label>
              <input
                value={content.cta_title || ''}
                onChange={(e) => update('cta_title', e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-sm font-bold">Deskripsi</label>
              <textarea
                rows={3}
                value={content.cta_desc || ''}
                onChange={(e) => update('cta_desc', e.target.value)}
                className={`mt-2 ${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-bold">Teks Tombol</label>
              <input
                value={content.cta_button || ''}
                onChange={(e) => update('cta_button', e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
          >
            <FloppyDisk size={16} weight="bold" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </div>
  )
}