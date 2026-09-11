import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'
import { adminLogin, isApiAvailable, getApiBase } from '../../api/client'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiOk, setApiOk] = useState(true)
  const [lockSeconds, setLockSeconds] = useState(0)

  useEffect(() => {
    isApiAvailable().then(setApiOk)
  }, [])

  useEffect(() => {
    if (lockSeconds <= 0) return
    const t = setInterval(() => setLockSeconds((s) => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [lockSeconds])

  const fmtLock = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockSeconds > 0) return
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(username, password)
      localStorage.setItem('admin_token', res.token)
      localStorage.setItem('admin_username', res.username)
      navigate('/admin/dashboard')
    } catch (err: any) {
      const msg = err.message || 'Login gagal'
      setError(msg)
      if (err.status === 429) setLockSeconds(err.retry_after || 300)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-black/[0.02] px-4 sm:px-8 py-8 sm:py-12">
      <div className="w-full max-w-6xl bg-[#FDECDC] rounded-[36px] sm:rounded-[44px] overflow-hidden shadow-xl shadow-black/5 flex flex-col lg:flex-row">

        {/* LEFT: brand / illustration */}
        <div className="relative bg-white lg:w-[56%] rounded-[36px] sm:rounded-[44px] lg:rounded-r-[50%_100%] p-8 sm:p-12 flex flex-col min-h-[300px] lg:min-h-[620px]">
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

          <p className="text-xs text-[#42210c]/40">© 2026 Ungkepan SN</p>
        </div>

        {/* RIGHT: admin login form */}
        <div className="flex-1 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <h1 className="font-display text-3xl sm:text-[38px] font-extrabold tracking-tight text-zinc-800">
            Login Admin
          </h1>

          {!apiOk && (
            <div className="mt-5 p-3.5 border border-[#e7bd77] bg-[#fdf3df] rounded-xl text-[14px]">
              <div className="flex items-start gap-2.5">
                <WarningCircle size={18} weight="fill" className="text-[#b45309] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#92400e] mb-1">API belum terhubung ({getApiBase()})</p>
                  <ul className="text-[#a16207] space-y-1">
                    <li>· Jalankan backend: folder <code className="font-mono text-[13px]">ungkepan-sn-backend</code> → <code className="font-mono text-[13px]">php artisan serve</code></li>
                    <li>· Pastikan domain Laragon / Herd aktif</li>
                    <li>· Pastikan database MySQL sudah running</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 p-3.5 border border-[#f2c2b0] bg-[#fdeee7] text-[14px] text-[#b3371a] rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 max-w-sm">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-bold text-zinc-700">Username</label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                placeholder="isi"
                autoComplete="username"
                required
              />
            </div>

            <div className="mt-2">
              <label htmlFor="admin-password" className="block text-sm font-bold text-zinc-700">Password</label>
              <div className="mt-2 relative">
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 pr-11 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              disabled={loading || lockSeconds > 0}
              className="mt-2 w-full py-3.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
            >
              {lockSeconds > 0
                ? `Terkunci — coba lagi dalam ${fmtLock(lockSeconds)}`
                : loading ? 'Cek password...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-zinc-500">
            <Link to="/" className="hover:text-zinc-700 transition-colors">Kembali ke toko</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
