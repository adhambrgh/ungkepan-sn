import { useEffect, useState } from 'react'
import { FloppyDisk, MapPin } from '@phosphor-icons/react'
import { adminUpdateSiteContent, getSiteContent } from '../../api/client'
import Toast from '../../components/ui/Toast'

interface ShippingMethod {
  value: string
  label: string
  desc: string
  cost: number
  is_active: boolean
}

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  try {
    const u = new URL(url)
    // https://www.google.com/maps/@lat,lng,...
    const atMatch = u.pathname.match(/\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
    // https://maps.google.com/?q=lat,lng or ?q=lat,lng&...
    const q = u.searchParams.get('q')
    if (q) {
      const parts = q.split(',')
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
      }
    }
  } catch {}
  return null
}

export default function ShippingSettings() {
  const [content, setContent] = useState<any>(null)
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })

  useEffect(() => {
    Promise.all([
      getSiteContent('shipping').catch(() => null),
      getSiteContent('shipping_methods').catch(() => null),
    ]).then(([shipping, methodsData]) => {
      setContent(shipping || {})
      setMethods(methodsData || [
        { value: 'jne', label: 'JNE Reguler', desc: '2-3 hari kerja', cost: 0, is_active: true },
        { value: 'jnt', label: 'J&T Express', desc: '1-2 hari kerja', cost: 0, is_active: true },
        { value: 'gosend', label: 'GoSend (Jabodetabek)', desc: 'Hari ini sampai', cost: 0, is_active: true },
        { value: 'lokal', label: 'Lokal (Ongkir berdasarkan jarak)', desc: 'Dihitung otomatis dari lokasi toko', cost: 0, is_active: true },
        { value: 'ambil', label: 'Ambil Langsung', desc: 'Ke rumah Mamak', cost: 0, is_active: true },
      ])
    }).finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }))
  }

  const updateMethod = (idx: number, field: string, value: any) => {
    setMethods((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const addMethod = () => {
    setMethods((prev) => [...prev, { value: '', label: '', desc: '', cost: 0, is_active: true }])
  }

  const removeMethod = (idx: number) => {
    setMethods((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminUpdateSiteContent('shipping', content)
      await adminUpdateSiteContent('shipping_methods', methods)
      setToast({ visible: true, message: 'Pengaturan ongkir berhasil disimpan!', type: 'success' })
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
    <div className="max-w-5xl mx-auto space-y-6">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <h1 className="text-2xl font-bold text-zinc-800">Pengaturan Ongkos Kirim</h1>

      {/* Metode Pengiriman */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-zinc-800">Metode Pengiriman</h2>
          <button
            type="button"
            onClick={addMethod}
            className="text-sm text-[#EA580C] font-medium hover:text-brand-700"
          >
            + Tambah
          </button>
        </div>
        <p className="text-sm text-zinc-400 mb-5">Metode ini akan tampil di halaman checkout</p>

        <div className="divide-y divide-zinc-100">
          {methods.map((m, i) => (
            <div key={i} className="py-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Value</label>
                <input
                  value={m.value}
                  onChange={(e) => updateMethod(i, 'value', e.target.value)}
                  className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="jne"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Label</label>
                <input
                  value={m.label}
                  onChange={(e) => updateMethod(i, 'label', e.target.value)}
                  className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="JNE Reguler"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Deskripsi</label>
                <input
                  value={m.desc}
                  onChange={(e) => updateMethod(i, 'desc', e.target.value)}
                  className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="2-3 hari kerja"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Biaya (Rp) — 0 = gratis</label>
                <input
                  type="number"
                  value={m.cost}
                  onChange={(e) => updateMethod(i, 'cost', Number(e.target.value))}
                  className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={m.is_active}
                    onChange={(e) => updateMethod(i, 'is_active', e.target.checked)}
                    className="rounded accent-[#EA580C]"
                  />
                  Aktif
                </label>
                <button
                  type="button"
                  onClick={() => removeMethod(i)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  🗑 Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {content && (
        <div className="space-y-6">
          {/* Informasi Pengiriman Lokal */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-zinc-800">Informasi Pengiriman Lokal</h2>
            <div>
              <label className="text-sm text-zinc-500 mb-1 block">Label</label>
              <input
                value={content.label || ''}
                onChange={(e) => update('label', e.target.value)}
                className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Lokal (Ongkir berdasarkan jarak)"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-500 mb-1 block">Deskripsi</label>
              <input
                value={content.desc || ''}
                onChange={(e) => update('desc', e.target.value)}
                className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-500 mb-1 block">Estimasi</label>
              <input
                value={content.estimation || ''}
                onChange={(e) => update('estimation', e.target.value)}
                className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                placeholder="1-2 hari"
              />
            </div>
          </div>

          {/* Biaya */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-zinc-800">Biaya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Biaya per Km (Rp)</label>
                <input
                  type="number"
                  value={content.cost_per_km || 5000}
                  onChange={(e) => update('cost_per_km', Number(e.target.value))}
                  className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Maksimal Jarak (Km)</label>
                <input
                  type="number"
                  value={content.max_distance || 20}
                  onChange={(e) => update('max_distance', Number(e.target.value))}
                  className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-500 mb-1 block">Gratis Ongkir minimal belanja (Rp 0 = nonaktif)</label>
              <input
                type="number"
                value={content.free_shipping_min || 0}
                onChange={(e) => update('free_shipping_min', Number(e.target.value))}
                className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Lokasi Toko */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-1">
              <MapPin size={16} className="text-[#EA580C]" /> Lokasi Toko
            </h2>
            <p className="text-sm text-zinc-400 -mt-3">
              Koordinat akan otomatis diekstrak dari link Google Maps
            </p>
            <div>
              <label className="text-sm text-zinc-500 mb-1 block">Google Maps Link</label>
              <input
                value={content.maps_link || ''}
                onChange={(e) => {
                  const url = e.target.value
                  update('maps_link', url)
                  const coords = extractCoordsFromUrl(url)
                  if (coords) {
                    update('store_lat', coords.lat)
                    update('store_lng', coords.lng)
                  }
                }}
                className="w-full rounded-lg bg-neutral-50 border border-zinc-200 px-3 py-2 text-sm"
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Latitude</label>
                <input
                  value={content.store_lat ?? -8.0313}
                  readOnly
                  className="w-full rounded-lg bg-neutral-100 border border-zinc-200 px-3 py-2 text-sm text-zinc-400"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Longitude</label>
                <input
                  value={content.store_lng ?? 112.6283}
                  readOnly
                  className="w-full rounded-lg bg-neutral-100 border border-zinc-200 px-3 py-2 text-sm text-zinc-400"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-[#EA580C] hover:bg-brand-700 disabled:bg-zinc-300 text-white font-semibold py-2.5 transition flex items-center justify-center gap-2"
          >
            <FloppyDisk size={18} weight="bold" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </div>
  )
}
