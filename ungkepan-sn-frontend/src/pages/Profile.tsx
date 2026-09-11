import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, MapPin, Receipt, Lock, SignOut } from '@phosphor-icons/react'
import { useAuthStore } from '../store/authStore'
import ProfileInfo from '../components/profile/ProfileInfo'
import AddressBook from '../components/profile/AddressBook'
import PasswordForm from '../components/profile/PasswordForm'
import Orders from './Orders'
import LoginPrompt from '../components/ui/LoginPrompt'
import ConfirmModal from '../components/ui/ConfirmModal'

type Tab = 'profil' | 'alamat' | 'pesanan' | 'password'

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'profil', label: 'Profil', icon: User },
  { key: 'alamat', label: 'Alamat Saya', icon: MapPin },
  { key: 'pesanan', label: 'Pesanan Saya', icon: Receipt },
  { key: 'password', label: 'Ubah Kata Sandi', icon: Lock },
]

const tabFromQuery = (v: string | null): Tab => {
  if (v === 'alamat') return 'alamat'
  if (v === 'pesanan') return 'pesanan'
  if (v === 'password') return 'password'
  return 'profil'
}

export default function Profile() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(tabFromQuery(searchParams.get('tab')))
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    if (!token) setShowLoginPrompt(true)
  }, [token])

  const selectTab = (t: Tab) => {
    if (t === 'profil') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ tab: t }, { replace: true })
    }
  }

  if (!token || !user) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-8 tracking-tight">
            Profil Saya
          </h1>
          <div className="p-8 bg-white rounded-2xl border border-black/5 text-center">
            <p className="text-lg font-semibold text-zinc-700 mb-2">Akun kamu belum masuk</p>
            <p className="text-zinc-500">
              Masuk atau daftar dulu untuk melihat profil dan pesanan.
            </p>
          </div>
        </main>
        <LoginPrompt
          open={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          redirect={tab === 'pesanan' ? '/profil?tab=pesanan' : '/profil'}
          context={tab === 'pesanan' ? 'lihat pesanan' : 'lihat profil'}
        />
      </>
    )
  }

  const navBtn = (t: Tab) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors w-full ${
      tab === t
        ? 'bg-[#EA580C] text-white'
        : 'text-zinc-600 hover:bg-black/5 hover:text-zinc-900'
    }`

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
      <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-8 tracking-tight">
        Profil Saya
      </h1>

      {/* Tab bar mobile */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 [scrollbar-width:none]">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => selectTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-[#EA580C] text-white' : 'bg-white text-zinc-600 border border-black/10'
              }`}
            >
              <Icon size={16} weight={active ? 'fill' : 'regular'} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col lg:sticky lg:top-24">
          <nav className="bg-white rounded-2xl p-3 border border-black/5 space-y-2" aria-label="Menu akun">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={navBtn(t.key)}>
                  <Icon size={17} weight={tab === t.key ? 'fill' : 'regular'} />
                  {t.label}
                </button>
              )
            })}
            <div className="!mt-3 pt-3 border-t border-black/5">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-red-500 hover:bg-red-50 transition-colors w-full"
              >
                <SignOut size={17} weight="bold" />
                Keluar
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          {tab === 'profil' && <ProfileInfo user={user} onUpdate={setUser} />}

          {tab === 'alamat' && <AddressBook />}

          {tab === 'pesanan' && <Orders />}

          {tab === 'password' && <PasswordForm user={user} />}
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Yakin mau keluar?"
        message="Kamu akan keluar dari akun ini."
        image="/Warning Illustration.png"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false)
          logout()
          navigate('/')
        }}
      />
    </main>
  )
}
