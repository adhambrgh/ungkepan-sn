import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, List, X, SignOut, User } from '@phosphor-icons/react'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { getMyOrders } from '../../api/client'

const navLinks = [
  { path: '/', label: 'Beranda' },
  { path: '/products', label: 'Produk' },
  { path: '/about', label: 'Tentang' },
  { path: '/contact', label: 'Kontak' },
  { path: '/favorit', label: 'Favorit' },
]

export default function Navbar() {
  const totalItems = useCartStore((s) => s.getTotalItems())
  const activeOrdersCount = useCartStore((s) => s.activeOrdersCount)
  const setActiveOrdersCount = useCartStore((s) => s.setActiveOrdersCount)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const activeIdx = navLinks.findIndex((l) => location.pathname === l.path)
  const profileTab = new URLSearchParams(location.search).get('tab')
  const pesananActive = location.pathname === '/profil' && profileTab === 'pesanan'
  const profilActive = location.pathname === '/profil' && !pesananActive
  const cartActive = location.pathname === '/cart'
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const showIndicatorFor = (idx: number) => {
    const el = navRefs.current[idx]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }

  const handleMouseEnter = (idx: number) => {
    setHoverIdx(idx)
    showIndicatorFor(idx)
  }

  const handleMouseLeave = () => {
    setHoverIdx(null)
    if (activeIdx === -1) {
      setIndicator({ left: 0, width: 0 })
    } else {
      showIndicatorFor(activeIdx)
    }
  }

  useEffect(() => {
    if (activeIdx === -1) {
      setIndicator({ left: 0, width: 0 })
      return
    }
    showIndicatorFor(activeIdx)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!user) { setActiveOrdersCount(0); return }
    let active = true

    const fetchCount = () => {
      getMyOrders().then((orders) => {
        if (!active) return
        const count = (orders || []).filter((o: any) => o.status === 'shipped' || (o.shipping_method === 'ambil' && o.status === 'processed')).length
        setActiveOrdersCount(count)
      }).catch(() => { if (active) setActiveOrdersCount(0) })
    }

    fetchCount()
    const timer = setInterval(fetchCount, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [user, location.pathname])

  useEffect(() => {
    const onResize = () => showIndicatorFor(hoverIdx ?? activeIdx)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [hoverIdx, activeIdx])

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-zinc-200' : 'bg-white border-b border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-1.5">
              <img src="/logo.png" alt="Ungkepan SN" className="h-12 md:h-16 w-auto" />
              <span className="text-lg md:text-xl font-bold text-brand-600">Ungkepan SN</span>
            </Link>

            <nav className="relative hidden md:flex items-end gap-10">
              {navLinks.map((link, i) => {
                const isActive = activeIdx === i
                return (
                  <Link
                    key={link.path}
                    ref={(el) => { navRefs.current[i] = el }}
                    to={link.path}
                    onMouseEnter={() => handleMouseEnter(i)}
                    onMouseLeave={handleMouseLeave}
                    className={`relative py-2 px-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-brand-600 font-semibold'
                        : 'text-zinc-600 hover:text-brand-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <span
                className={`absolute bottom-0 h-[2px] bg-brand-600 ${
                  animate ? 'transition-all duration-500 ease-in-out' : ''
                }`}
                style={{ left: indicator.left, width: indicator.width }}
              />
            </nav>

            <div className="flex items-center gap-4">
              <Link
                to="/profil?tab=pesanan"
                className={`group hidden lg:inline-flex relative py-2 px-1 text-sm font-medium transition-colors ${
                  pesananActive
                    ? 'text-brand-600 font-semibold'
                    : 'text-zinc-600 hover:text-brand-600'
                }`}
              >
                Pesanan Saya
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {activeOrdersCount > 99 ? '99+' : activeOrdersCount}
                  </span>
                )}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-brand-600 transition-all duration-500 ease-in-out group-hover:w-full ${
                    pesananActive ? 'w-full' : 'w-0'
                  }`}
                />
              </Link>
              <Link
                to="/cart"
                className={`relative flex items-center justify-center w-10 h-10 rounded-[8px] transition-all ${
                  cartActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-zinc-50 text-zinc-700 hover:bg-brand-50 hover:text-brand-600'
                }`}
              >
                <ShoppingCart size={20} weight="bold" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
              {user ? (
                <Link
                  to="/profil"
                  className={`flex items-center justify-center w-10 h-10 rounded-[8px] transition-all ${
                    profilActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-brand-50 hover:text-brand-600'
                  }`}
                  title="Profil"
                >
                  <User size={20} weight="bold" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:inline-flex px-4 py-2 rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-all"
                >
                  Masuk
                </Link>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex md:hidden items-center justify-center w-10 h-10 rounded-[8px] bg-zinc-50 text-zinc-700 hover:bg-zinc-100 transition-all"
                aria-label="Menu"
              >
                {menuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="pt-20 px-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-3 rounded-[8px] transition-colors text-sm font-medium ${
                      isActive
                        ? 'text-brand-600 font-semibold bg-brand-50'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-brand-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <Link
                to="/profil?tab=pesanan"
                className={`flex items-center justify-between px-4 py-3 rounded-[8px] transition-colors text-sm font-medium ${
                  pesananActive
                    ? 'text-brand-600 font-semibold bg-brand-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-brand-600'
                }`}
              >
                <span>Pesanan Saya</span>
                {activeOrdersCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {activeOrdersCount > 99 ? '99+' : activeOrdersCount}
                  </span>
                )}
              </Link>
              <hr className="my-3 border-zinc-100" />
              {user ? (
                <div className="flex items-center justify-between px-1 py-1">
                  <Link
                    to="/profil"
                    className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all"
                  >
                    <User size={20} weight="bold" className="text-brand-600 shrink-0" />
                    <span className="truncate">Profil & Pesanan</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-[#b3371a] hover:text-red-700 transition-colors"
                  >
                    <SignOut size={16} weight="bold" /> Keluar
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-3 rounded-[8px] text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-all"
                >
                  Masuk / Daftar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
