import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash, Image, Spinner, CaretDown, CaretRight, Bank, DeviceMobile, CurrencyDollar, CreditCard, Ticket, X } from '@phosphor-icons/react'
import { adminGetPaymentMethods, adminCreatePaymentMethod, adminUpdatePaymentMethod, adminDeletePaymentMethod, adminUploadQris, adminGetPromos, adminCreatePromo, adminUpdatePromo, adminDeletePromo } from '../../api/client'
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal'
import SuccessModal from '../../components/ui/SuccessModal'
import type { PaymentMethod, Promo } from '../../api/client'

const categoryConfig: Record<string, { label: string; icon: React.ElementType; desc: string; methods: string[] }> = {
  transfer: { label: 'Transfer Bank', icon: Bank, desc: 'Transfer antar bank', methods: ['transfer'] },
  ewallet: { label: 'E-Wallet', icon: DeviceMobile, desc: 'E-Wallet & QRIS', methods: ['e-wallet', 'qris'] },
  midtrans: { label: 'Bayar Online', icon: CreditCard, desc: 'Midtrans (kartu, VA, e-wallet)', methods: ['midtrans'] },
  cod: { label: 'Cash', icon: CurrencyDollar, desc: 'Bayar di tempat', methods: ['cod'] },
}

export default function PaymentSettings() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [uploadingQris, setUploadingQris] = useState<number | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const qrisUploadRef = useRef<HTMLInputElement>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const logoRef = useRef('')

  const [promos, setPromos] = useState<Promo[]>([])
  const [showAddPromo, setShowAddPromo] = useState(false)
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null)
  const [savingPromo, setSavingPromo] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [confirmPromoDelete, setConfirmPromoDelete] = useState<{ id: number; code: string } | null>(null)
  const [promoForm, setPromoForm] = useState({
    code: '',
    type: 'fixed' as 'fixed' | 'percent',
    value: 0,
    min_order: 0,
    max_discount: 0,
    is_active: true,
  })

  const [form, setForm] = useState({
    method: 'midtrans' as PaymentMethod['method'],
    label: '',
    account_name: '',
    account_number: '',
    bank_name: '',
    logo: '',
    is_active: 1,
    sort_order: 0,
  })

  const fetchMethods = () => {
    setLoading(true)
    adminGetPaymentMethods()
      .then(setMethods)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMethods() }, [])

  const resetForm = () => {
    setForm({ method: 'midtrans', label: '', account_name: '', account_number: '', bank_name: '', logo: '', is_active: 1, sort_order: 0 })
    setLogoPreview('')
    logoRef.current = ''
    setShowAdd(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      setUploadingLogo(true)
      const payload = { ...form, logo: logoRef.current || form.logo }
      if (editingId) {
        await adminUpdatePaymentMethod({ id: editingId, ...payload })
        setSuccess('Metode pembayaran berhasil diubah')
      } else {
        await adminCreatePaymentMethod(payload)
        setSuccess('Metode pembayaran berhasil ditambahkan')
      }
      resetForm()
      fetchMethods()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleEdit = (m: PaymentMethod) => {
    const logo = m.logo || ''
    setForm({
      method: m.method,
      label: m.label,
      account_name: m.account_name,
      account_number: m.account_number,
      bank_name: m.bank_name,
      logo,
      is_active: m.is_active,
      sort_order: m.sort_order,
    })
    setLogoPreview(logo)
    logoRef.current = logo
    setEditingId(m.id)
    setShowAdd(true)
  }

  const handleDelete = (id: number, label: string) => {
    setConfirmDelete({ id, label })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      await adminDeletePaymentMethod(confirmDelete.id); fetchMethods(); setConfirmDelete(null)
      setSuccess('Metode pembayaran berhasil dihapus')
    } catch (err: any) {
      setConfirmDelete(null); setError(err.message)
    }
  }

  const handleQrisUpload = async (id: number) => {
    const file = qrisUploadRef.current?.files?.[0]
    if (!file) return
    setUploadingQris(id)
    try {
      await adminUploadQris(id, file)
      fetchMethods()
      setSuccess('Gambar QRIS berhasil diperbarui')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingQris(null)
      if (qrisUploadRef.current) qrisUploadRef.current.value = ''
    }
  }

  const grouped: Record<string, PaymentMethod[]> = {
    midtrans: methods.filter((m) => m.method === 'midtrans'),
    cod: methods.filter((m) => m.method === 'cod'),
  }

  const handleAddNew = () => {
    resetForm()
    setShowAdd(true)
  }

  const handleAddInCategory = (catKey: string) => {
    resetForm()
    if (catKey === 'midtrans') setForm((prev) => ({ ...prev, method: 'midtrans' }))
    else setForm((prev) => ({ ...prev, method: 'cod' }))
    setShowAdd(true)
    setExpandedCategory(catKey)
  }

  const fetchPromos = () => {
    adminGetPromos().then(setPromos).catch((err) => setError(err.message))
  }

  useEffect(() => { fetchPromos() }, [])

  const resetPromoForm = () => {
    setPromoForm({ code: '', type: 'fixed', value: 0, min_order: 0, max_discount: 0, is_active: true })
    setPromoError('')
    setShowAddPromo(false)
    setEditingPromoId(null)
  }

  const handlePromoEdit = (p: Promo) => {
    setPromoForm({
      code: p.code,
      type: p.type,
      value: p.value,
      min_order: p.min_order,
      max_discount: p.max_discount,
      is_active: p.is_active === 1,
    })
    setEditingPromoId(p.id)
    setShowAddPromo(true)
  }

  const handlePromoDelete = (p: Promo) => {
    setConfirmPromoDelete({ id: p.id, code: p.code })
  }

  const handlePromoConfirmDelete = async () => {
    if (!confirmPromoDelete) return
    try {
      await adminDeletePromo(confirmPromoDelete.id)
      setConfirmPromoDelete(null)
      fetchPromos()
      setSuccess('Kode promo berhasil dihapus')
    } catch (err: any) {
      setConfirmPromoDelete(null)
      setPromoError(err.message)
    }
  }

  const handlePromoSave = async () => {
    setPromoError('')
    setSavingPromo(true)
    try {
      const payload = {
        code: promoForm.code,
        type: promoForm.type,
        value: Number(promoForm.value) || 0,
        min_order: Number(promoForm.min_order) || 0,
        max_discount: Number(promoForm.max_discount) || 0,
        is_active: promoForm.is_active,
      }
      if (editingPromoId) {
        await adminUpdatePromo({ id: editingPromoId, ...payload })
        setSuccess('Kode promo berhasil diubah')
      } else {
        await adminCreatePromo(payload)
        setSuccess('Kode promo berhasil ditambahkan')
      }
      resetPromoForm()
      fetchPromos()
    } catch (err: any) {
      setPromoError(err.message)
    } finally {
      setSavingPromo(false)
    }
  }

  const formatPromoValue = (p: Promo) => {
    if (p.type === 'percent') return `${p.value}%`
    return `Rp ${p.value.toLocaleString('id-ID')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-800">Pengaturan Pembayaran</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-[8px] transition-colors"
        >
          <Plus size={18} weight="bold" />
          Tambah
        </button>
      </div>

      <ConfirmDeleteModal
        open={confirmDelete !== null}
        title="Hapus Metode Pembayaran"
        message={`Yakin ingin menghapus metode "${confirmDelete?.label}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDeleteModal
        open={confirmPromoDelete !== null}
        title="Hapus Kode Promo"
        message={`Yakin ingin menghapus kode promo "${confirmPromoDelete?.code}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handlePromoConfirmDelete}
        onCancel={() => setConfirmPromoDelete(null)}
      />

      <SuccessModal
        open={success !== null}
        message={success || ''}
        onConfirm={() => setSuccess(null)}
      />

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>
      )}

      {/* Add / Edit Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6"
          onClick={resetForm}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-800">{editingId ? 'Edit' : 'Tambah'} Metode Pembayaran</h2>
              <button
                onClick={resetForm}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Tipe</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod['method'] })}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
              >
                <option value="midtrans">Midtrans (Bayar Online)</option>
                <option value="cod">COD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Label</label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                placeholder="Transfer BNI"
              />
            </div>
            {form.method !== 'qris' && form.method !== 'cod' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Atas Nama</label>
                  <input
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                    placeholder="Ungkepan SN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Nomor Rekening / Akun</label>
                  <input
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                    placeholder="1234567890"
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Logo</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.logo}
                  onChange={(e) => { logoRef.current = e.target.value; setForm({ ...form, logo: e.target.value }); setLogoPreview(e.target.value) }}
                  className="flex-1 px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder="https://example.com/logo.png"
                />
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setLogoPreview('(memuat...)')
                      const r = new FileReader()
                      r.onload = () => {
                        const url = r.result as string
                        logoRef.current = url
                        setLogoPreview(url)
                        setForm((prev) => ({ ...prev, logo: url }))
                      }
                      r.onerror = () => setLogoPreview('')
                      r.readAsDataURL(file)
                    }
                    if (logoFileRef.current) logoFileRef.current.value = ''
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-[8px] transition-colors shrink-0"
                >
                  <Image size={16} />
                  Upload
                </button>
                {form.logo && !form.logo.startsWith('http') && (
                  <button
                    type="button"
                    onClick={() => { logoRef.current = ''; setForm((prev) => ({ ...prev, logo: '' })); setLogoPreview('') }}
                    className="text-xs text-red-500 hover:text-red-600 shrink-0"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">Upload file atau masukkan URL gambar logo</p>
              {(logoPreview || form.logo) && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={logoPreview || form.logo}
                    alt="preview"
                    className="h-12 rounded-lg object-contain border border-zinc-200 bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ''
                      ;(e.target as HTMLImageElement).classList.add('hidden')
                    }}
                  />
                </div>
              )}
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-6">
              <div className="w-full sm:w-44">
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Urutan</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer sm:mt-4">
                <input
                  type="checkbox"
                  checked={form.is_active === 1}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                  className="w-5 h-5 accent-brand-500"
                />
                <span className="text-sm font-medium text-zinc-700">Aktif</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={uploadingLogo}
              className="px-6 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:bg-zinc-300 rounded-xl transition-colors"
            >
              {uploadingLogo ? 'Mengupload...' : editingId ? 'Simpan' : 'Tambah'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Batal
            </button>
          </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] text-zinc-400">Memuat...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, catMethods]) => {
            const cfg = categoryConfig[key]
            const Icon = cfg.icon
            const isOpen = expandedCategory === key

            return (
              <div key={key} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                <div
                  onClick={() => setExpandedCategory(isOpen ? null : key)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-800">{cfg.label}</span>
                      <span className="text-xs text-zinc-400">({catMethods.length})</span>
                    </div>
                    <p className="text-xs text-zinc-400">{cfg.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleAddInCategory(key) }}
className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                    {isOpen ? <CaretDown size={16} className="text-zinc-400" /> : <CaretRight size={16} className="text-zinc-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-zinc-100">
                    {catMethods.length === 0 ? (
                      <div className="p-6 text-center text-sm text-zinc-400">
                        Belum ada metode {cfg.label.toLowerCase()}
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {catMethods.map((m) => {
                          const isQris = m.method === 'qris'
                          return (
                            <div
                              key={m.id}
                              className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                                m.is_active ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {m.logo ? (
                                  <img src={m.logo} alt="" className="w-7 h-7 object-contain rounded-lg shrink-0" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-zinc-100 shrink-0" />
                                )}
                                <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-zinc-800 text-sm">{m.label}</span>
                                  {!m.is_active && (
                                    <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">Nonaktif</span>
                                  )}
                                </div>
                                {m.method === 'transfer' && m.bank_name && (
                                  <p className="text-xs text-zinc-500 truncate">{m.bank_name} — {m.account_number}</p>
                                )}
                                {m.method === 'e-wallet' && (
                                  <p className="text-xs text-zinc-500 truncate">{m.account_number}</p>
                                )}
                                {isQris && m.qris_image && (
                                  <p className="text-xs text-green-600">QRIS sudah diupload</p>
                                )}
                                {isQris && !m.qris_image && (
                                  <p className="text-xs text-amber-500">Upload QRIS image</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {isQris && (
                                  <>
                                    <input
                                      ref={qrisUploadRef}
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={() => handleQrisUpload(m.id)}
                                      className="hidden"
                                    />
                                    <button
                                      onClick={() => qrisUploadRef.current?.click()}
                                      disabled={uploadingQris === m.id}
                                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    >
                                      {uploadingQris === m.id ? <Spinner size={12} className="animate-spin" /> : <Image size={12} />}
                                    </button>
                                  </>
                                )}
                                  <button
                                    onClick={() => handleEdit(m)}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#F5730C]/40 text-[#F5730C] hover:bg-[#FFF1E6] transition-colors"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(m.id, m.label)}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash size={14} />
                                  </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Kode Promo */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="flex items-center gap-3 p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-600 shrink-0">
            <Ticket size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800">Kode Promo</span>
              <span className="text-xs text-zinc-400">({promos.length})</span>
            </div>
            <p className="text-xs text-zinc-400">Kupon diskon yang dipakai di halaman keranjang</p>
          </div>
          {!showAddPromo && (
            <button
              type="button"
              onClick={() => { setShowAddPromo(true); setPromoError('') }}
              className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors"
            >
              <Plus size={14} weight="bold" />
            </button>
          )}
        </div>

        {showAddPromo && (
          <div className="border-t border-zinc-100 p-5 space-y-4">
            <h3 className="font-bold text-zinc-700 text-sm">
              {editingPromoId ? 'Edit Kode Promo' : 'Buat Kode Promo'}
            </h3>
            {promoError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl">{promoError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Kode</label>
                <input
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none uppercase"
                  placeholder="CONTOH10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Tipe Diskon</label>
                <select
                  value={promoForm.type}
                  onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as 'fixed' | 'percent' })}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                >
                  <option value="fixed">Nominal (Rp)</option>
                  <option value="percent">Persen (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">
                  {promoForm.type === 'percent' ? 'Persentase (%)' : 'Nominal (Rp)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={promoForm.value}
                  onChange={(e) => setPromoForm({ ...promoForm, value: Number(e.target.value) })}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder={promoForm.type === 'percent' ? '10' : '5000'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">Min. Belanja (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={promoForm.min_order}
                  onChange={(e) => setPromoForm({ ...promoForm, min_order: Number(e.target.value) })}
                  className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                  placeholder="0 = tanpa minimal"
                />
              </div>
              {promoForm.type === 'percent' && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Maks. Diskon (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={promoForm.max_discount}
                    onChange={(e) => setPromoForm({ ...promoForm, max_discount: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-base border-2 border-zinc-200 rounded-xl focus:border-brand-500 focus:outline-none"
                    placeholder="0 = tanpa batas"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoForm.is_active}
                    onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                    className="w-5 h-5 accent-brand-500"
                  />
                  <span className="text-sm font-medium text-zinc-700">Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePromoSave}
                disabled={savingPromo}
className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-300 rounded-[8px] transition-colors"
              >
                {savingPromo ? 'Menyimpan...' : editingPromoId ? 'Simpan' : 'Tambah'}
              </button>
              <button
                onClick={resetPromoForm}
className="px-6 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-[8px] transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {!showAddPromo && (
          <div className="border-t border-zinc-100">
            {promos.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-400">Belum ada kode promo</div>
            ) : (
              <div className="p-3 space-y-2">
                {promos.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                      p.is_active ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-600 shrink-0">
                        <Ticket size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-zinc-800 text-sm uppercase tracking-wide">{p.code}</span>
                          {!p.is_active && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">Nonaktif</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          Diskon {formatPromoValue(p)}
                          {p.min_order > 0 && ` • Min. Rp ${p.min_order.toLocaleString('id-ID')}`}
                          {p.type === 'percent' && p.max_discount > 0 && ` • Maks. Rp ${p.max_discount.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePromoEdit(p)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#F5730C]/40 text-[#F5730C] hover:bg-[#FFF1E6] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handlePromoDelete(p)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
