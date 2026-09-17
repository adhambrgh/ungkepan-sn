import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Envelope } from '@phosphor-icons/react'
import { forgotPassword } from '../api/client'
import Toast from '../components/ui/Toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [devUrl, setDevUrl] = useState<string | null>(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setToast({ ...toast, visible: false })
    try {
      const res = await forgotPassword(email.trim())
      setSent(true)
      setDevUrl(res.dev_reset_url || null)
    } catch (err: any) {
      setToast({ visible: true, message: err.message || 'Gagal memproses permintaan', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

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
              Lupa Password?
            </h1>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              Tenang, kami bantu. Masukkan email yang kamu pakai daftar, nanti kami kirim link untuk
              ganti password.
            </p>

            {sent ? (
              <div className="mt-8 space-y-3">
                <div className="p-4 border border-green-200 bg-green-50 rounded-xl text-sm text-green-700 leading-relaxed">
                  Link reset sudah dikirim ke <b>{email}</b>. Buka emailnya dan ikuti instruksinya
                  untuk membuat password baru.
                </div>

                {devUrl && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl text-sm text-blue-700 leading-relaxed">
                    <p className="font-bold mb-1">Mode pengembangan — belum ada SMTP aktif, jadi link reset muncul di sini:</p>
                    <a href={devUrl} className="font-semibold underline break-all hover:text-blue-800">
                      {devUrl}
                    </a>
                  </div>
                )}

                <button
                  onClick={() => { setSent(false); setDevUrl(null) }}
                  className="w-full py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {error && (
                  <div className="p-3.5 border border-[#f2c2b0] bg-[#fdeee7] text-[14px] text-[#b3371a] rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-bold text-zinc-700">Email</label>
                  <div className="mt-2 relative">
                    <Envelope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-400"
                      placeholder="nama@email.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Mengirim link...' : 'Kirim Link Reset'}
                </button>

                <p className="text-center text-sm text-zinc-500">
                  Ingat password kamu?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    Login di sini
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}