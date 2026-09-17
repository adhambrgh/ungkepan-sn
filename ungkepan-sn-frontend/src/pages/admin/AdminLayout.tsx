import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  SquaresFour,
  ShoppingBag,
  Tag,
  ClipboardText,
  Info,
  Envelope,
  CreditCard,
  Truck,
  Star,
  Storefront,
  List,
  SignOut,
  WarningCircle,
  CheckCircle,
} from '@phosphor-icons/react'
import { isApiAvailable, getApiBase } from '../../api/client'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: SquaresFour },
  { path: '/admin/dashboard/products', label: 'Produk', icon: ShoppingBag },
  { path: '/admin/dashboard/categories', label: 'Kategori', icon: Tag },
  { path: '/admin/dashboard/orders', label: 'Pesanan', icon: ClipboardText },
  { path: '/admin/dashboard/about', label: 'Tentang Kami', icon: Info },
  { path: '/admin/dashboard/contact', label: 'Kontak', icon: Envelope },
  { path: '/admin/dashboard/payments', label: 'Pembayaran', icon: CreditCard },
  { path: '/admin/dashboard/shipping', label: 'Ongkir', icon: Truck },
  { path: '/admin/dashboard/reviews', label: 'Testimoni', icon: Star },
  { path: '/admin/dashboard/hero', label: 'Hero', icon: Storefront },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiOk, setApiOk] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) navigate('/admin/login')
    isApiAvailable().then(setApiOk)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      {/* Top bar mobile */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-zinc-200 px-4 h-14">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-600">
          <List size={24} />
        </button>
        <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold text-brand-600">
          <img src="/logo.png" alt="" className="h-8 w-auto" />
          Admin
        </Link>
        <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors">
          <SignOut size={20} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 border-b border-zinc-100">
            <Link to="/admin/dashboard" className="flex items-center text-xl font-bold text-brand-600">
              <img src="/logo.png" alt="Ungkepan SN" className="h-10 w-auto" />
              <span className="-ml-2">Admin Panel</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-zinc-100">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 hover:text-brand-600 transition-colors"
            >
              Ke Website
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full rounded-xl transition-colors"
            >
              <SignOut size={16} />
              Keluar
            </button>
          </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto">
          {!apiOk && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
              <WarningCircle size={18} weight="fill" />
              <span>API tidak terhubung ({getApiBase()}). Pastikan Laravel backend sudah running (misal: <code>php artisan serve</code>).</span>
            </div>
          )}
          {apiOk && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-green-700 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle size={18} weight="fill" />
              <span>Database terhubung ✓</span>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
