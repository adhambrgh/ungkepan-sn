import { Link, useLocation } from 'react-router-dom'
import { House, ShoppingBag, User, Storefront, Phone } from '@phosphor-icons/react'

const items = [
  { path: '/', label: 'Beranda', icon: House, activeIcon: House },
  { path: '/products', label: 'Produk', icon: ShoppingBag, activeIcon: ShoppingBag },
  { path: '/profil', label: 'Profil', icon: User, activeIcon: User },
  { path: '/about', label: 'Tentang', icon: Storefront, activeIcon: Storefront },
  { path: '/contact', label: 'Kontak', icon: Phone, activeIcon: Phone },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <div className="flex h-full items-center">
        {items.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full transition-colors"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={22}
                weight={isActive ? 'fill' : 'regular'}
                className={isActive ? 'text-brand-600' : 'text-zinc-400 dark:text-zinc-500'}
              />
              <span
                className={`text-[10px] leading-tight ${
                  isActive
                    ? 'font-semibold text-brand-600'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
