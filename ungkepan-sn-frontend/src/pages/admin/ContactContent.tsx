import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FloppyDisk } from '@phosphor-icons/react'
import { adminUpdateSiteContent, getSiteContent } from '../../api/client'
import Toast from '../../components/ui/Toast'
import SuccessModal from '../../components/ui/SuccessModal'

export default function ContactContent() {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    getSiteContent('contact').then((data) => {
      if (data) setContent(data)
      else setContent({})
    }).catch(() => setContent({})).finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminUpdateSiteContent('contact', content)
      setSuccess('Konten Kontak berhasil disimpan!')
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

      <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Konten Kontak</h1>

      {content && (
        <div className="space-y-6">
          {/* Subtitle */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Header</h2>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Subtitle</label>
              <input
                value={content.subtitle || ''}
                onChange={(e) => update('subtitle', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">WhatsApp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Nomor (format internasional, tanpa +)</label>
                <input
                  value={content.whatsapp || ''}
                  onChange={(e) => update('whatsapp', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder="6281234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Tampilan Nomor</label>
                <input
                  value={content.whatsapp_display || ''}
                  onChange={(e) => update('whatsapp_display', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder="0812-3456-7890"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Label</label>
              <input
                value={content.whatsapp_label || ''}
                onChange={(e) => update('whatsapp_label', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="Fast response, chat aja"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Lokasi</h2>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Alamat</label>
              <input
                value={content.location || ''}
                onChange={(e) => update('location', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="Jakarta, Indonesia"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Catatan</label>
              <input
                value={content.location_note || ''}
                onChange={(e) => update('location_note', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Teks Placeholder Peta</label>
              <input
                value={content.map_placeholder || ''}
                onChange={(e) => update('map_placeholder', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Google Maps URL</label>
              <input
                value={content.maps_url || ''}
                onChange={(e) => update('maps_url', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Plus Code</label>
              <input
                value={content.plus_code || ''}
                onChange={(e) => update('plus_code', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="XJ9H+98Q"
              />
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Email</h2>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Alamat Email</label>
              <input
                value={content.email || ''}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="ungkepansn@email.com"
              />
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
            <h2 className="font-bold text-zinc-700">Jam Operasional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Hari Kerja</label>
                <input
                  value={content.hours_weekday || ''}
                  onChange={(e) => update('hours_weekday', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder="Senin - Sabtu: 08.00 - 20.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Akhir Pekan</label>
                <input
                  value={content.hours_weekend || ''}
                  onChange={(e) => update('hours_weekend', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder="Minggu: 09.00 - 17.00"
                />
              </div>
            </div>
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
