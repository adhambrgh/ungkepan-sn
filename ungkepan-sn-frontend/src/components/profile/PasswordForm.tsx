import { useState } from 'react'
import { Eye, EyeSlash, Check, SpinnerGap, WarningCircle } from '@phosphor-icons/react'
import { changePassword, type CustomerUser } from '../../api/client'

type Props = {
  user: CustomerUser
}

const inputCls =
  'w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-[#EA580C]/10 transition-colors'
const labelCls = 'block text-sm font-bold text-zinc-800 mb-2'

export default function PasswordForm({ user }: Props) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const googleOnly = !user.phone && user.avatar && !current && !next && !confirm && false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    if (next.length < 6) {
      setMsg('Password baru minimal 6 karakter')
      return
    }
    if (next !== confirm) {
      setMsg('Konfirmasi password tidak sama')
      return
    }
    setSaving(true)
    try {
      await changePassword(current, next)
      setMsg('Password berhasil diganti')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err: any) {
      setMsg(err.message || 'Gagal ganti password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-9 max-w-xl">
      <h2 className="text-xl font-bold mb-2">Ubah Kata Sandi</h2>
      <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
        {googleOnly
          ? 'Akun kamu pakai Google, jadi nggak pakai password.'
          : 'Ganti password biar akun tetap aman. Jangan kasih ke siapa pun.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Password Saat Ini</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} placeholder="••••••••" autoComplete="current-password" required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#C2410C]" aria-label="Tampilkan">
              {show ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Password Baru</label>
          <input type={show ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} placeholder="minimal 6 karakter" autoComplete="new-password" required />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#C2410C]" aria-label="Tampilkan">
              {show ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
        </div>

        <div>
          <label className={labelCls}>Ulangi Password Baru</label>
          <input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="••••••••" autoComplete="new-password" required />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#C2410C]" aria-label="Tampilkan">
              {show ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
        </div>

        {msg && (
          <p className={`flex items-start gap-2 text-sm leading-relaxed ${msg === 'Password berhasil diganti' ? 'text-green-600' : 'text-red-500'}`}>
            {msg === 'Password berhasil diganti' ? <Check size={15} weight="bold" className="mt-0.5 shrink-0" /> : <WarningCircle size={15} weight="fill" className="mt-0.5 shrink-0" />}
            {msg}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
          >
            {saving ? <SpinnerGap size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
            Ganti Password
          </button>
        </div>
      </form>
    </div>
  )
}
