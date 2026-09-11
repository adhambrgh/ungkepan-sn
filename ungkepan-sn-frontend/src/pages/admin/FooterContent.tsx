import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react'
import { adminUpdateSiteContent, getSiteContent } from '../../api/client'
import Toast from '../../components/ui/Toast'

export default function FooterContent() {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })

  useEffect(() => {
    getSiteContent('footer').then((data) => {
      if (data) setContent(data)
      else setContent({ description: '', copyright: '© {year} Ungkepan SN. Dibuat dengan sepenuh hati.' })
    }).catch(() => setContent({ description: '', copyright: '© {year} Ungkepan SN. Dibuat dengan sepenuh hati.' })).finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminUpdateSiteContent('footer', content)
      setToast({ visible: true, message: 'Footer berhasil disimpan!', type: 'success' })
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

      <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Footer</h1>

      {content && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Konten Footer</h2>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Deskripsi</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none resize-none"
                placeholder="Jajanan rumahan enak, bersih, dan terpercaya..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Teks Copyright</label>
              <input
                value={content.copyright || ''}
                onChange={(e) => update('copyright', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="© {year} Ungkepan SN. Dibuat dengan sepenuh hati."
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:bg-zinc-300 rounded-full transition-colors"
          >
            <FloppyDisk size={18} weight="bold" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </div>
  )
}
