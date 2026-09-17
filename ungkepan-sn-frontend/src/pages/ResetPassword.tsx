import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Eye, EyeSlash, Lock, WarningCircle } from '@phosphor-icons/react'
import { resetPassword } from '../api/client'
import Toast from '../components/ui/Toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (!token || !email) {
      setError('Link reset tidak lengkap. Silakan minta link baru lewat halaman Lupa Password.')
    }
  }, [token, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak sama')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email, token, password)
      setToast({ visible: true, message: 'Password berhasil diubah! Yuk login pakai password baru.', type: 'success' })
      setTimeout(() => navigate('/login'), 1800)
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password')
    } finally {
      setLoading(false)
    }
  }

  const invalid = !token || !email

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-black/[0.02] px-4 sm:px-8 py-8 sm:py-12">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={16} /> Kembali ke Login
        </Link>

        <div className="bg-[#FDECDC] rounded-[32px] overflow-hidden shadow-xl shadow-black/5">
          <div className="p-8 sm:p-10">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo Ungkepan SN" className="h-9 w-auto shrink-0" />
              <span className="text-lg font-extrabold tracking-tight text-zinc-800">Ungkepan SN</span>
            </Link>

            <h1 className="mt-8 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800">
              Buat Password Baru
            </h1>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              Atur password baru untuk akun <b className="text-zinc-800">{email || 'kamu'}</b>.
            </p>

            {invalid ? (
              <div className="mt-8 p-4 border border-[#f2c2b0] bg-[#fdeee7] text-sm text-[#b3371a] rounded-xl flex items-start gap-2">
                <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {error && (
                  <div className="p-3.5 border border-[#f2c2b0] bg-[#fdeee7] text-[14px] text-[#b3371a] rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="reset-password" className="block text-sm font-bold text-zinc-700">Password Baru</label>
                  <div className="mt-2 relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="reset-password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white pl-11 pr-11 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'Sembunyikan password' : 'Tunjukkan password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-600 transition-colors"
                    >
                      {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-sm font-bold text-zinc-700">Konfirmasi Password</label>
                  <div className="mt-2 relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="reset-confirm"
                      type={showPw ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white pl-11 pr-11 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                      placeholder="Ulangi password baru"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check size={18} weight="bold" />
                  )}
                  {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}