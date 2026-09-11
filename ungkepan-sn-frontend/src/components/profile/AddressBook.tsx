import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Plus, PencilSimple, Trash, Check, SpinnerGap, X } from '@phosphor-icons/react'
import { getAddresses, createAddress, updateAddress, deleteAddress, type UserAddress, type AddressInput } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import LocationPicker from '../ui/LocationPicker'

const inputCls =
  'w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-brand-600 transition-colors'
const labelCls = 'block text-sm font-bold text-zinc-800 mb-2'

type FormState = {
  id?: number
  label: string
  name: string
  phone: string
  city: string
  province: string
  address: string
  rt_rw: string
  patokan: string
  postal_code: string
  maps_url: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
}

const emptyForm: FormState = {
  label: 'Rumah',
  name: '',
  phone: '',
  city: '',
  province: '',
  address: '',
  rt_rw: '',
  patokan: '',
  postal_code: '',
  maps_url: '',
  latitude: null,
  longitude: null,
  is_default: false,
}

export default function AddressBook() {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    const onUnauthorized = () => {
      useAuthStore.getState().logout()
      setShowForm(false)
      setError('')
      setLoading(false)
    }
    window.addEventListener('customer:unauthorized', onUnauthorized)
    return () => window.removeEventListener('customer:unauthorized', onUnauthorized)
  }, [])

  const handleMapSelect = ({ address, city, province, postcode, lat, lng }: {
    address: string; city: string; district: string; province: string; postcode: string; lat: number; lng: number
  }) => {
    setForm((f) => ({ ...f, address, city, province, latitude: lat, longitude: lng, postal_code: postcode || f.postal_code }))
  }

  const fetchAddresses = () => {
    getAddresses()
      .then((res) => setAddresses(res.addresses))
      .catch(() => setError('Gagal ambil alamat'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (token) fetchAddresses()
    else setLoading(false)
  }, [token])

  const openAdd = () => {
    setForm({ ...emptyForm })
    setShowForm(true)
    setError('')
  }

  const openEdit = (a: UserAddress) => {
    setForm({
      id: a.id,
      label: a.label,
      name: a.name || '',
      phone: a.phone || '',
      city: a.city || '',
      province: a.province || '',
      address: a.address,
      rt_rw: a.rt_rw || '',
      patokan: a.patokan || '',
      postal_code: a.postal_code || '',
      maps_url: a.maps_url || '',
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
      is_default: a.is_default,
    })
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!form.address.trim()) {
      setError('Alamat wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: AddressInput = {
        label: form.label,
        name: form.name,
        phone: form.phone,
        city: form.city,
        province: form.province,
        address: form.address,
        rt_rw: form.rt_rw || null,
        patokan: form.patokan || null,
        postal_code: form.postal_code,
        maps_url: form.maps_url || null,
        latitude: form.latitude,
        longitude: form.longitude,
        is_default: form.is_default,
      }
      if (form.id) {
        await updateAddress({ ...payload, id: form.id })
      } else {
        await createAddress(payload)
      }
      setShowForm(false)
      setForm(emptyForm)
      fetchAddresses()
    } catch (err: any) {
      setError(err.message || 'Gagal simpan alamat')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus alamat ini?')) return
    try {
      await deleteAddress(id)
      fetchAddresses()
    } catch (err: any) {
      setError(err.message || 'Gagal hapus')
    }
  }

  const handleSetDefault = async (id: number) => {
    const target = addresses.find((a) => a.id === id)
    if (!target) return
    try {
      await updateAddress({ ...target, id, is_default: true })
      fetchAddresses()
    } catch (err: any) {
      setError(err.message || 'Gagal set utama')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Alamat Saya</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Alamat untuk checkout.</p>
        </div>
        {token && !showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
          >
            <Plus size={15} weight="bold" />
            Tambah
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!token ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-black/5">
          <MapPin size={36} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-zinc-700 font-semibold">Masuk dulu untuk simpan alamat kamu</p>
          <p className="text-sm text-zinc-400 mt-1">Alamat tersimpan biar checkout makin cepat.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
          >
            Masuk
          </Link>
        </div>
      ) : (
        <>
      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold">{form.id ? 'Edit Alamat' : 'Tambah Alamat'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-[#C2410C] transition-colors" aria-label="Tutup">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label className={labelCls}>Label</label>
              <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls}>
                <option>Rumah</option>
                <option>Kantor</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nama</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Nama penerima" />
            </div>
            <div>
              <label className={labelCls}>Nomor</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Alamat (Link URL)</label>
              <input type="url" value={form.maps_url} onChange={(e) => setForm({ ...form, maps_url: e.target.value })} className={inputCls} placeholder="Masukkan Link URL Google Maps" />
            </div>
          </div>

          {/* Pilih dari peta */}
          <div className="mt-5">
            <label className={labelCls}>Ambil Dari Google Maps</label>
            <p className="text-[13px] text-zinc-500 -mt-1 mb-3 leading-relaxed">
              Klik pada peta atau gunakan tombol lokasimu. Provinsi, kota, dan alamat lengkap
              akan otomatis terisi. Marker bisa digeser untuk lebih presisi.
            </p>
            <LocationPicker
              defaultAddress={form.address || undefined}
              defaultCity={form.city || undefined}
              onLocationSelect={handleMapSelect}
            />
          </div>

          <div className="mt-4">
            <label className={labelCls}>Alamat Lengkap / Detail</label>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`${inputCls} resize-none`}
              placeholder="Nama jalan, nomor rumah, kelurahan, dll (otomatis terisi dari peta)"
            />
          </div>

          <div className="mt-4">
            <div>
              <label className={labelCls}>Patokan / Detail Tambahan</label>
              <input type="text" value={form.patokan} onChange={(e) => setForm({ ...form, patokan: e.target.value })} className={inputCls} placeholder="Sebelah masjid, depan minimarket, dll" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label className={labelCls}>Kode Pos</label>
              <input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className={inputCls} placeholder="65149" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 accent-[#EA580C]" />
                <span className="text-[14px] text-zinc-700 font-medium">Jadikan alamat utama</span>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
            >
              {saving ? <SpinnerGap size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
              {form.id ? 'Simpan Alamat' : 'Tambah'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <SpinnerGap size={24} className="animate-spin text-[#EA580C]" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-black/5">
          <MapPin size={36} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-zinc-500 font-semibold">Belum ada alamat tersimpan.</p>
          <p className="text-sm text-zinc-400 mt-1">Tambah alamat biar checkout makin cepat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-black/5 p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {a.is_default && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#EA580C] text-white text-[10.5px] font-bold tracking-wide uppercase">
                      Utama
                    </span>
                  )}
                  <span className="text-[14px] font-semibold text-zinc-800">{a.label}</span>
                  {a.name && <span className="text-[14px] text-zinc-500">· {a.name}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!a.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(a.id)}
                      title="Jadikan alamat utama"
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-[12px] font-semibold transition-colors"
                    >
                      Jadikan Utama
                    </button>
                  )}
                  <button type="button" onClick={() => openEdit(a)} className="p-1.5 text-zinc-400 hover:text-[#C2410C] hover:bg-black/5 rounded-md transition-colors" aria-label="Edit">
                    <PencilSimple size={16} />
                  </button>
                  <button type="button" onClick={() => handleDelete(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" aria-label="Hapus">
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              {a.phone && <p className="text-[13.5px] text-zinc-500">📞 {a.phone}</p>}
              <p className="text-[14.5px] text-zinc-700 leading-relaxed mt-1.5">
                <span className="font-medium">{a.name ? `${a.name}, ` : ''}</span>
                {a.address}
                {a.rt_rw ? `, ${a.rt_rw}` : ''}
                {a.patokan ? ` (${a.patokan})` : ''}
                {a.district ? `, Kec. ${a.district}` : ''}
                {a.city ? `, ${a.city}` : ''}
                {a.province ? `, ${a.province}` : ''}
                {a.postal_code ? ` ${a.postal_code}` : ''}
              </p>
              {a.maps_url && (
                <a
                  href={a.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-semibold text-[#EA580C] hover:text-[#C2410C] hover:underline transition-colors"
                >
                  <MapPin size={14} weight="fill" />
                  Buka di Maps
                </a>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  )
}