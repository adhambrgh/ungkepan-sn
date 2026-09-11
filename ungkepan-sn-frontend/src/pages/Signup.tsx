import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'
import { customerRegister, customerGoogleLogin } from '../api/client'
import { useAuthStore } from '../store/authStore'
import GoogleButton from '../components/ui/GoogleButton'

export default function Signup() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const redirect = params.get('redirect') || '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi password tidak cocok.')
      return
    }
    setLocalError('')
    setLoading(true)
    try {
      await customerRegister({ name, email, phone, password })
      const target = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
      navigate(target, { replace: true, state: { signupSuccess: email } })
    } catch (err: any) {
      setError(err.message || 'Daftar gagal')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (token: string) => {
    setGoogleLoading(true)
    setError('')
    try {
      const res = await customerGoogleLogin(token)
      setAuth(res.token, res.user)
      navigate(redirect, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Login Google gagal')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-black/[0.02] px-4 sm:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl bg-[#FDECDC] rounded-[36px] sm:rounded-[44px] overflow-hidden shadow-xl shadow-black/5 flex flex-col lg:flex-row">

        {/* LEFT: brand / illustration */}
        <div className="relative bg-white lg:w-[56%] rounded-[36px] sm:rounded-[44px] lg:rounded-r-[50%_100%] p-8 sm:p-12 flex flex-col min-h-[300px] lg:min-h-[640px]">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo Ungkepan SN" className="h-12 w-auto shrink-0" />
            <span className="text-lg font-extrabold tracking-tight text-zinc-800">Ungkepan SN</span>
          </Link>

          <div className="flex-1 flex items-center justify-center py-8">
            <img
              src="/login.png"
              alt="Ilustrasi warung Ungkepan SN"
              className="w-full max-w-lg rounded-[24px]"
            />
          </div>

          <p className="text-xs text-zinc-400">© 2026 Ungkepan SN</p>
        </div>

        {/* RIGHT: signup form */}
        <div className="flex-1 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <h1 className="font-display text-3xl sm:text-[38px] font-extrabold tracking-tight text-zinc-800">
            Buat Akun
          </h1>

          {redirect !== '/' && (
            <div className="mt-2 p-3.5 border border-brand-200 bg-brand-50 rounded-xl text-[13.5px] text-brand-800 leading-relaxed">
              Mau lanjut bayar? Daftar dulu aja — setelah ini kamu langsung balik ke checkout, tinggal isi alamat.
            </div>
          )}

          {error && (
            <div className="mt-2 p-3.5 border border-[#f2c2b0] bg-[#fdeee7] text-[14px] text-[#b3371a] rounded-xl">
              {error}
            </div>
          )}

          {localError && (
            <div className="mt-2 p-3.5 border border-[#f2c2b0] bg-[#fdeee7] text-[14px] text-[#b3371a] rounded-xl">
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-2">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-bold text-zinc-700">Nama Lengkap</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                placeholder="mis. Bunga Maharani"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-bold text-zinc-700">Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                placeholder="nama@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-phone" className="block text-sm font-bold text-zinc-700">
                Nomor WhatsApp <span className="font-normal text-zinc-400">(opsional)</span>
              </label>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                placeholder="0812xxxxxx"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-bold text-zinc-700">Password</label>
              <div className="mt-2 relative">
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 pr-11 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                  placeholder="minimal 6 karakter"
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
              <label htmlFor="signup-confirm" className="block text-sm font-bold text-zinc-700">Konfirmasi Password</label>
              <div className="mt-2 relative">
                <input
                  id="signup-confirm"
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 pr-11 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                  placeholder="ulangi password"
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

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Bikin akun...' : 'Daftar & Lanjut'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-xs font-medium text-zinc-400">atau</span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            <GoogleButton onCredential={handleGoogle} loading={googleLoading} />

            <p className="text-sm text-center text-zinc-500">
              Sudah punya akun?{' '}
              <Link
                to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
                className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </form>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-zinc-500">
            <Link to="/" className="hover:text-zinc-700 transition-colors">Kembali ke toko</Link>
            <p className="flex items-center gap-2">
              <WarningCircle size={14} weight="fill" className="shrink-0" />
              Akun cuma buat nyimpen datamu biar checkout lebih cepat. Data nggak dibagikan ke mana-mana.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
