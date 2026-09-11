import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash, Image, UploadSimple, Cookie, Coffee, BowlFood, Cake, ForkKnife, Snowflake, TeaBag, Hamburger, Fish, Bread, IceCream, Drop } from '@phosphor-icons/react'
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory, resolveImage, API_BASE } from '../../api/client'
import Toast from '../../components/ui/Toast'
import ConfirmModal from '../../components/ui/ConfirmModal'

interface Category {
  id: number
  name: string
  slug: string
  image?: string
  icon?: string
}

const ICONS = [
  { value: 'Cookie', label: 'Kue Kering', comp: Cookie },
  { value: 'Cake', label: 'Kue Basah', comp: Cake },
  { value: 'BowlFood', label: 'Camilan', comp: BowlFood },
  { value: 'Coffee', label: 'Kopi', comp: Coffee },
  { value: 'TeaBag', label: 'Teh', comp: TeaBag },
  { value: 'Drop', label: 'Minuman', comp: Drop },
  { value: 'ForkKnife', label: 'Makanan', comp: ForkKnife },
  { value: 'Hamburger', label: 'Fast Food', comp: Hamburger },
  { value: 'Snowflake', label: 'Frozen Food', comp: Snowflake },
  { value: 'Fish', label: 'Ikan', comp: Fish },
  { value: 'Bread', label: 'Roti', comp: Bread },
  { value: 'IceCream', label: 'Es Krim', comp: IceCream },
] as const

type ImageMode = 'url' | 'upload'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('Cookie')
  const [imageMode, setImageMode] = useState<ImageMode>('url')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)

  const loadCategories = () => {
    setLoading(true)
    adminGetCategories()
      .then((data: any[]) => {
        setCategories(data.map((c: any) => ({ ...c, image: resolveImage(c.image || '') })))
      })
      .catch(() => setToast({ visible: true, message: 'Gagal memuat kategori', type: 'error' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCategories() }, [])

  const autoSlug = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const resetModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setName('')
    setSlug('')
    setIcon('Cookie')
    setImageUrl('')
    setImageFile(null)
    setImagePreview('')
    setImageMode('url')
  }

  const openAdd = () => {
    setModalMode('add')
    setModalOpen(true)
  }

  const startEdit = (c: Category) => {
    setModalMode('edit')
    setEditingId(c.id)
    setName(c.name)
    setSlug(c.slug)
    setIcon(c.icon || 'Cookie')
    const isUpload = c.image?.startsWith(API_BASE + '/uploads/') || c.image?.startsWith('uploads/')
    setImageMode(isUpload ? 'upload' : 'url')
    if (isUpload) { setImagePreview(resolveImage(c.image || '')); setImageUrl('') }
    else { setImageUrl(c.image || ''); setImagePreview('') }
    setImageFile(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    try {
      const image = imageFile ? undefined : (imageUrl.trim() || undefined)
      const slugValue = slug.trim() || autoSlug(trimmedName)
      if (modalMode === 'add') {
        await adminCreateCategory(trimmedName, image, icon, imageFile)
        setToast({ visible: true, message: 'Kategori berhasil ditambahkan', type: 'success' })
      } else if (editingId) {
        await adminUpdateCategory(editingId, trimmedName, icon, image, imageFile)
        setToast({ visible: true, message: 'Kategori berhasil diubah', type: 'success' })
      }
      resetModal()
      loadCategories()
    } catch (err: any) {
      setToast({ visible: true, message: err.message || 'Gagal menyimpan kategori', type: 'error' })
    }
  }

  const handleDelete = (id: number, name: string) => {
    setConfirmDelete({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      await adminDeleteCategory(confirmDelete.id); loadCategories()
      setConfirmDelete(null)
      setToast({ visible: true, message: 'Kategori berhasil dihapus', type: 'success' })
    } catch (err: any) {
      setConfirmDelete(null)
      setToast({ visible: true, message: err.message || 'Gagal menghapus kategori', type: 'error' })
    }
  }

  const IconDropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const current = ICONS.find(i => i.value === value) || ICONS[0]
    const Comp = current.comp
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 pr-10 text-sm border-2 border-black/10 rounded-xl focus:border-brand-500 focus:outline-none bg-white"
        >
          {ICONS.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
          <Comp size={18} />
        </div>
      </div>
    )
  }

  const ImagePicker = ({ mode, onModeChange, url, onUrlChange, file, onFileChange, preview, onPreviewChange, fileRef }: {
    mode: ImageMode; onModeChange: (m: ImageMode) => void
    url: string; onUrlChange: (v: string) => void
    file: File | null; onFileChange: (f: File | null) => void
    preview: string; onPreviewChange: (v: string) => void
    fileRef: React.RefObject<HTMLInputElement | null>
  }) => (
    <div>
      <div className="flex gap-1 mb-2 bg-black/[0.03] p-1 rounded-xl">
        <button type="button" onClick={() => onModeChange('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${mode === 'url' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'}`}>
          <Image size={14} /> URL
        </button>
        <button type="button" onClick={() => onModeChange('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${mode === 'upload' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'}`}>
          <UploadSimple size={14} /> Upload
        </button>
      </div>
      {mode === 'url' ? (
        <div className="flex gap-2">
          <input value={url} onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://..." className="flex-1 px-3 py-2 text-sm border-2 border-black/10 rounded-xl focus:border-brand-500 focus:outline-none" />
          {url && <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0"><img src={url} alt="" className="w-full h-full object-cover" /></div>}
        </div>
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFileChange(f); onPreviewChange(URL.createObjectURL(f)) } }}
            className="hidden" />
          <div onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 px-4 py-5 border-2 border-dashed border-black/10 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-20 rounded-lg object-cover" />
            ) : (
              <><UploadSimple size={24} className="text-zinc-300" /><p className="text-xs text-zinc-400">Klik pilih file</p></>
            )}
          </div>
          {file && <p className="text-xs text-zinc-500 mt-1">{file.name}</p>}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Toast visible={toast.visible} message={toast.message} type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })} />

      <ConfirmModal
        open={confirmDelete !== null}
        title="Hapus Kategori"
        message={`Yakin ingin menghapus kategori "${confirmDelete?.name}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight">Kategori</h1>
        <button type="button" onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-[8px] transition-colors">
          <Plus size={16} weight="bold" />
          Tambah
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-zinc-400">Memuat...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">Belum ada kategori</div>
      ) : (
        <>
        {/* Kartu (mobile) */}
        <div className="md:hidden space-y-3">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-800">{c.name}</p>
                <p className="text-sm text-zinc-400 truncate">{c.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" aria-label={`Edit ${c.name}`}
                  onClick={() => startEdit(c)}
                  className="w-10 h-10 rounded-lg border border-brand-500/40 text-brand-500 flex items-center justify-center hover:bg-brand-50 transition-colors">
                  <Pencil size={16} weight="bold" />
                </button>
                <button type="button" aria-label={`Hapus ${c.name}`}
                  onClick={() => handleDelete(c.id, c.name)}
                  className="w-10 h-10 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors">
                  <Trash size={16} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tabel (desktop) */}
        <div className="hidden md:block bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-zinc-400 uppercase tracking-wide bg-black/[0.02] border-b border-black/5">
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-5 font-bold">{c.name}</td>
                    <td className="px-6 py-5 text-zinc-400">{c.slug}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" aria-label={`Edit ${c.name}`}
                          onClick={() => startEdit(c)}
                          className="w-8 h-8 rounded-lg border border-brand-500/40 text-brand-500 flex items-center justify-center hover:bg-brand-50 transition-colors">
                          <Pencil size={14} weight="bold" />
                        </button>
                        <button type="button" aria-label={`Hapus ${c.name}`}
                          onClick={() => handleDelete(c.id, c.name)}
                          className="w-8 h-8 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors">
                          <Trash size={14} weight="bold" />
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

      {/* Tambah/Edit Kategori modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) resetModal() }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-extrabold">
              {modalMode === 'edit' ? 'Edit Kategori' : 'Tambah Kategori'}
            </h2>
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
              <div>
                <label htmlFor="categoryName" className="block text-sm font-bold">Nama</label>
                <input id="categoryName" type="text" required placeholder="Contoh: Frozen Food"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (modalMode === 'add') setSlug(autoSlug(e.target.value)) }}
                  className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400" />
              </div>
              <div>
                <label htmlFor="categorySlug" className="block text-sm font-bold">Slug</label>
                <input id="categorySlug" type="text" required placeholder="contoh: frozen-food"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400" />
              </div>

              <div>
                <label className="block text-sm font-bold">Icon</label>
                <div className="mt-2">
                  <IconDropdown value={icon} onChange={setIcon} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold">Gambar</label>
                <div className="mt-2">
                  <ImagePicker mode={imageMode} onModeChange={setImageMode}
                    url={imageUrl} onUrlChange={setImageUrl}
                    file={imageFile} onFileChange={setImageFile}
                    preview={imagePreview} onPreviewChange={setImagePreview}
                    fileRef={fileRef} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetModal}
                  className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-semibold hover:bg-black/5 transition-colors">Batal</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}