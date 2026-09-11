import { useRef, useState } from 'react'
import { Camera, SpinnerGap } from '@phosphor-icons/react'
import { updateProfile, uploadProfileAvatar, resolveImage, type CustomerUser } from '../../api/client'

type Props = {
  user: CustomerUser
  onUpdate: (user: CustomerUser) => void
}

const inputCls =
  'w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-[#EA580C]/10 transition-colors'
const labelCls = 'block text-sm font-bold text-zinc-800 mb-2'

export default function ProfileInfo({ user, onUpdate }: Props) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone || '')
  const [birthdate, setBirthdate] = useState(user.birthdate || '')
  const [gender, setGender] = useState<'male' | 'female' | ''>(user.gender || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const avatarSrc = user.avatar ? resolveImage(user.avatar) : null

  const handleSave = async () => {
    if (!name.trim()) {
      setMsg('Nama nggak boleh kosong')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await updateProfile({ name, phone, birthdate: birthdate || undefined, gender: gender || undefined })
      onUpdate(res.user)
      setMsg('Tersimpan')
    } catch (err: any) {
      setMsg(err.message || 'Gagal simpan')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg('')
    try {
      const res = await uploadProfileAvatar(file)
      onUpdate(res.user)
      setMsg('Foto profil diperbarui')
    } catch (err: any) {
      setMsg(err.message || 'Gagal upload foto')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-9">
      <h2 className="text-xl font-bold">Informasi Pribadi</h2>

      <div className="mt-7 flex flex-col sm:flex-row gap-8">
        {/* Foto */}
        <div className="shrink-0 flex flex-col items-center sm:items-start gap-3 sm:w-32">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative w-28 h-28 rounded-full overflow-hidden bg-zinc-100 group disabled:opacity-70"
            aria-label="Ubah foto profil"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full text-zinc-300" fill="currentColor">
                <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-1.8a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4ZM4 19.5c0-3.3 3.2-5.5 8-5.5s8 2.2 8 5.5V21H4v-1.5Zm1.6.3h12.8c-.4-2-3-3.6-6.4-3.6s-6 1.6-6.4 3.6Z"/>
              </svg>
            )}
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <SpinnerGap size={26} className="text-white animate-spin" />
              ) : (
                <Camera size={26} className="text-white" />
              )}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatar} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold text-center transition-colors"
          >
            Ubah Foto
          </button>
          <p className="text-[11px] text-zinc-400 text-center sm:text-left leading-relaxed">
            Ukuran maks 2MB, format JPG atau PNG.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nama kamu" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={user.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelCls}>Nomor WhatsApp</label>
            <div className="flex items-center rounded-xl border border-black/10 focus-within:border-brand-600 overflow-hidden">
              <span className="pl-4 pr-2 py-3 text-[15px] text-zinc-400 border-r border-black/10">+62</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-3 text-[15px] outline-none" placeholder="812xxxxxxx" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tanggal Lahir</label>
            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <span className={labelCls}>Jenis Kelamin</span>
            <div className="mt-2 flex items-center gap-7">
              {(['male', 'female'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2 text-[15px] text-zinc-600 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="w-4 h-4 accent-brand-600"
                  />
                  {g === 'male' ? 'Laki-laki' : 'Perempuan'}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between gap-4">
        <p className={`text-[13px] ${msg === 'Tersimpan' || msg === 'Foto profil diperbarui' ? 'text-green-600' : msg ? 'text-red-500' : 'opacity-0'}`}>
          {msg || '·'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <SpinnerGap size={16} className="animate-spin" />}
          Simpan Perubahan
        </button>
      </div>
    </div>
  )
}
