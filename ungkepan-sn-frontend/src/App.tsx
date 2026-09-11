import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import BottomNav from './components/layout/BottomNav'
import Footer from './components/layout/Footer'
import ShippedPopup from './components/notification/ShippedPopup'
import ApiStatusBanner from './components/ApiStatusBanner'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Favorites from './pages/Favorites'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import ProductForm from './pages/admin/ProductForm'
import AdminOrders from './pages/admin/Orders'
import AboutContent from './pages/admin/AboutContent'
import ContactContent from './pages/admin/ContactContent'
import PaymentSettings from './pages/admin/PaymentSettings'
import ShippingSettings from './pages/admin/ShippingSettings'
import AdminReviews from './pages/admin/Reviews'
import HeroContent from './pages/admin/HeroContent'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'
import { useFavoritesStore } from './store/favoritesStore'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const authed = typeof window !== 'undefined' && !!localStorage.getItem('admin_token')
  if (!authed) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

function AdminEntry() {
  return <Navigate to="/admin/login" replace />
}

export default function App() {
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const hydrateCart = useCartStore((s) => s.hydrateFromServer)
  const hydrateFavorites = useFavoritesStore((s) => s.hydrateFromServer)
  const resetCart = useCartStore((s) => s.clearCart)
  const resetFavorites = useFavoritesStore((s) => s.reset)

  useEffect(() => {
    if (token) {
      hydrateCart()
      hydrateFavorites()
    } else {
      resetCart()
      resetFavorites()
    }
  }, [token, hydrateCart, hydrateFavorites, resetCart, resetFavorites])

  const isBare = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin/login'
  const isAdminPath = location.pathname.startsWith('/admin')

  if (isBare) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white text-zinc-800">
      {!isAdminPath && <ApiStatusBanner />}
      {!isAdminPath && <Navbar />}
      <div className="flex-1 pb-16 lg:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/favorit" element={<Favorites />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Navigate to="/profil" replace />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminEntry />} />
          <Route path="/admin/dashboard" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="products/tambah" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="about" element={<AboutContent />} />
            <Route path="contact" element={<ContactContent />} />
            <Route path="payments" element={<PaymentSettings />} />
            <Route path="shipping" element={<ShippingSettings />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="hero" element={<HeroContent />} />
          </Route>
        </Routes>
      </div>
      <BottomNav />
      {!isAdminPath && location.pathname !== '/about' && <Footer />}
      {!isAdminPath && <ShippedPopup />}
    </div>
  )
}
