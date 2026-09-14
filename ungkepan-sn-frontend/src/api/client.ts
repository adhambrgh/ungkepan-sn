import type { Product, Category } from '../types'
import { products as localProducts, categories as localCategories } from '../data/products'
import { Cookie, Coffee, BowlFood, Cake, ForkKnife, Snowflake, TeaBag, Hamburger, Fish, Bread, IceCream, Drop } from '@phosphor-icons/react'

const ENV_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '')

// Candidate URLs to probe in local development
const CANDIDATE_URLS = [
  ...(ENV_API_URL ? [ENV_API_URL] : []),
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://ungkepan-sn-api.test',
  'http://ungkepan-sn-backend.test',
  'http://localhost/ungkepan-sn-backend/public',
  'http://localhost/ungkepan-sn-api',
]

// Current active base URL
export let API_BASE = ENV_API_URL || 'http://127.0.0.1:8000'

// Simpan URL yang sudah terbukti bekerja di session, supaya reload
// berikutnya tidak membuang request untuk men-scan semua kandidat.
const persistedUrl = (() => {
  try { return sessionStorage.getItem('ungkepan-sn-api-base') } catch { return null }
})()
if (persistedUrl) API_BASE = persistedUrl

function persistBase(url: string | null) {
  try {
    if (url) sessionStorage.setItem('ungkepan-sn-api-base', url)
    else sessionStorage.removeItem('ungkepan-sn-api-base')
  } catch { /* ignore */ }
}

export function getApiBase(): string {
  return API_BASE
}

// ─── Caching API status ───
let apiAvailable: boolean | null = null
let apiChecking = false
let apiCheckers: ((val: boolean) => void)[] = []
let retryTimer: ReturnType<typeof setTimeout> | null = null
const statusListeners: Set<(online: boolean) => void> = new Set()

export function onApiStatusChange(fn: (online: boolean) => void): () => void {
  statusListeners.add(fn)
  return () => statusListeners.delete(fn)
}

function notifyStatus(online: boolean) {
  statusListeners.forEach((fn) => fn(online))
}

function scheduleRetry() {
  if (retryTimer) return
  retryTimer = setTimeout(async () => {
    retryTimer = null
    if (apiAvailable === false) {
      const ok = await checkApi(true)
      if (ok) notifyStatus(true)
      else scheduleRetry()
    }
  }, 10_000)
}

export async function checkApi(forceRefresh = false): Promise<boolean> {
  if (!forceRefresh && apiAvailable !== null) return apiAvailable
  if (apiChecking) {
    return new Promise((resolve) => apiCheckers.push(resolve))
  }
  apiChecking = true

  const urlsToTry = Array.from(
    new Set(
      (persistedUrl && !forceRefresh ? [persistedUrl] : [])
        .concat(ENV_API_URL ? [ENV_API_URL, ...CANDIDATE_URLS] : CANDIDATE_URLS)
    )
  )

  const probe = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(`${url}/categories.php`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          return url
        }
      }
    } catch {
      // try next candidate
    }
    return null
  }

  // Mutar-mutar urutan tanpa urutan spesifik — tombak pertama
  // dikasih ke URL yang terakhir terbukti jalan (1 request, hemat throttle).
  // Kalau itu gagal, baru scan semua kandidat untuk recovery.
  let foundUrl: string | null = null
  if (persistedUrl && !forceRefresh) {
    foundUrl = await probe(persistedUrl)
  }
  if (!foundUrl) {
    const results = await Promise.all(urlsToTry.map(probe))
    foundUrl = results.find(Boolean) ? results.find(Boolean)! : null
  }

  const prev = apiAvailable
  if (foundUrl) {
    API_BASE = foundUrl
    apiAvailable = true
    persistBase(foundUrl)
  } else {
    apiAvailable = false
    persistBase(null)
  }

  apiChecking = false
  apiCheckers.forEach((fn) => fn(apiAvailable!))
  apiCheckers = []

  if (prev === false && apiAvailable === true) notifyStatus(true)
  if (!apiAvailable) scheduleRetry()

  return apiAvailable
}

// Cek sekali saat halaman dimuat
checkApi()

const iconMap: Record<string, React.ElementType> = {
  Cookie, Coffee, BowlFood, Cake, ForkKnife, Snowflake, TeaBag, Hamburger, Fish, Bread, IceCream, Drop,
}

// ─── Request helper ───
function clearCustomerSession() {
  try {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('ungkepan-sn-auth')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('customer:unauthorized'))
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    if (res.status === 401) {
      const raw = options?.headers as Record<string, string> | undefined
      const authHeader = typeof raw?.Authorization === 'string' ? raw.Authorization : ''
      const customerToken = localStorage.getItem('customer_token')
      // Token customer basi/invalid → bersihkan sesi agar tidak mentok "Unauthorized"
      if (customerToken && authHeader === `Bearer ${customerToken}`) {
        clearCustomerSession()
      }
    }
    const e = new Error(data.error || `HTTP ${res.status}`) as Error & { status?: number; retry_after?: number }
    e.status = res.status
    if (typeof data.retry_after === 'number') e.retry_after = data.retry_after
    throw e
  }
  return res.json()
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function customerAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('customer_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Normalize API data ───

export function resolveImage(src: string): string {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }
  if (src.startsWith('uploads/')) return `${API_BASE}/${src}`
  if (src.startsWith('/uploads/')) return `${API_BASE}${src}`
  return src
}

function normalizeProduct(p: any): Product {
  return {
    id: String(p.id),
    name: p.name,
    category: String(p.category_id),
    categoryName: p.category_name || '',
    price: Number(p.price),
    image: resolveImage(p.image),
    description: p.description,
    weight: p.weight,
    stock: Number(p.stock),
    is_featured: Number(p.is_featured) || 0,
    avg_rating: Number(p.avg_rating) || 0,
    review_count: Number(p.review_count) || 0,
    serving_steps: Array.isArray(p.serving_steps) ? p.serving_steps : undefined,
  }
}

function normalizeCategory(c: any): Category {
  return {
    id: String(c.id),
    name: c.name,
    icon: iconMap[c.icon as string] || Cookie,
    image: resolveImage(c.image),
  }
}

// ─── Public API (dengan fallback) ───

export async function getProducts(): Promise<Product[]> {
  if (await checkApi()) {
    try {
      const res = await request<any>('/products.php')
      const list = Array.isArray(res) ? res : (res?.data ?? [])
      return list.map(normalizeProduct)
    } catch {
      // request gagal (DB down, server error) → fallback ke data lokal
    }
  }
  return localProducts.map((p) => ({
    ...p,
    categoryName: localCategories.find((c) => c.id === p.category)?.name || p.category,
  }))
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (await checkApi()) {
    try {
      const res = await request<any>('/products.php?featured=1')
      const list = Array.isArray(res) ? res : (res?.data ?? [])
      return list.map(normalizeProduct)
    } catch {
      // fallback if column is_featured belum ada
    }
  }
  return localProducts.slice(0, 4).map((p) => ({
    ...p,
    is_featured: 1,
    categoryName: localCategories.find((c) => c.id === p.category)?.name || p.category,
  }))
}

export async function adminToggleFeatured(id: number, is_featured: boolean) {
  return request<{ success: boolean }>('/admin/products.php', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, is_featured: is_featured ? 1 : 0 }),
  })
}

export async function getProduct(id: string): Promise<Product | null> {
  if (await checkApi()) {
    try {
      const data = await request<any>(`/products.php?id=${id}`)
      return normalizeProduct(data)
    } catch {
      return null
    }
  }
  return localProducts.find((p) => p.id === id) || null
}

export async function getCategories(): Promise<Category[]> {
  if (await checkApi()) {
    try {
      const data = await request<any[]>('/categories.php')
      return data.map(normalizeCategory)
    } catch {
      // fallback ke data lokal
    }
  }
  return localCategories
}

export async function createOrder(data: {
  customer_name: string
  phone: string
  address: string
  city: string
  notes?: string
  shipping_method: string
  payment_method: string
  total: number
  discount?: number
  promo_code?: string | null
  items: { product_id: string; product_name: string; product_price: number; quantity: number }[]
}) {
  if (await checkApi()) {
    return request<{ success: boolean; order_code: string; id: number }>('/orders.php', {
      method: 'POST',
      headers: customerAuthHeaders(),
      body: JSON.stringify(data),
    })
  }
  const orderCode = 'WM-' + Date.now().toString(36).toUpperCase()
  return { success: true, order_code: orderCode, id: Date.now() }
}

export async function getOrdersByPhone(phone: string) {
  if (await checkApi()) {
    try {
      return await request<any[]>(`/orders.php?phone=${encodeURIComponent(phone)}`)
    } catch {
      return []
    }
  }
  return []
}

export async function getMyOrders() {
  return request<any[]>(`/orders.php`, { headers: customerAuthHeaders() })
}

// ─── Midtrans Snap ───

export async function getOrderSnapToken(order_code: string) {
  return request<{ snap_token: string }>('/orders-snap-token.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ order_code }),
  })
}

// Function to load & open the Midtrans Snap popup
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: {
        onSuccess?: (result: any) => void
        onPending?: (result: any) => void
        onError?: (result: any) => void
        onClose?: (result: any) => void
      }) => void
    }
  }
}

export function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.snap) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat popup pembayaran'))
    document.head.appendChild(script)
  })
}

export function payWithSnap(
  token: string,
  callbacks: {
    onSuccess?: (result: any) => void
    onPending?: (result: any) => void
    onError?: (result: any) => void
    onClose?: (result: any) => void
  }
) {
  if (typeof window !== 'undefined' && window.snap) {
    window.snap.pay(token, callbacks)
  } else {
    throw new Error('Popup pembayaran belum siap')
  }
}

// ─── Cart (per-user, DB) ───

export type ServerCartItem = {
  product: {
    id: number
    name: string
    price: number
    image: string
    description?: string
    weight?: string
    stock: number
    is_featured?: number
    category_id?: number
  }
  quantity: number
  selected: boolean
}

export async function getCart(): Promise<{ items: ServerCartItem[] }> {
  return request<{ items: ServerCartItem[] }>('/cart.php', { headers: customerAuthHeaders() })
}

export async function addCartItem(productId: string | number, quantity: number, selected: boolean) {
  return request<{ items: ServerCartItem[] }>('/cart.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ product_id: String(productId), quantity, selected }),
  })
}

export async function updateCartItem(productId: string | number, data: { quantity?: number; selected?: boolean }) {
  return request<{ items: ServerCartItem[] }>('/cart.php', {
    method: 'PUT',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ product_id: String(productId), ...data }),
  })
}

export async function removeCartItem(productId: string | number) {
  return request<{ items: ServerCartItem[] }>('/cart.php', {
    method: 'DELETE',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ product_id: String(productId) }),
  })
}

export async function clearCartServer() {
  return request<{ items: ServerCartItem[] }>('/cart-clear.php', {
    method: 'DELETE',
    headers: customerAuthHeaders(),
  })
}

// ─── Favorites (per-user, DB) ───

export async function getFavorites(): Promise<{ ids: number[] }> {
  return request<{ ids: number[] }>('/favorites.php', { headers: customerAuthHeaders() })
}

export async function toggleFavoriteServer(productId: string | number): Promise<{ ids: number[] }> {
  return request<{ ids: number[] }>('/favorites.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ product_id: String(productId) }),
  })
}

export type ApplyPromoResult = {
  success: boolean
  amount: number
  code: string
  type: 'fixed' | 'percent'
  value: number
  min_order: number
  max_discount: number
}

export async function applyCustomerPromo(code: string, subtotal: number): Promise<ApplyPromoResult> {
  return request<ApplyPromoResult>('/promos/apply.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ code, subtotal }),
  })
}

export async function useCustomerPromo(code: string, order_code: string) {
  return request<{ success: boolean }>('/promos/use.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ code, order_code }),
  })
}

export async function confirmOrderReceived(order_code: string) {
  return request<{ success: boolean }>('/orders-confirm.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ order_code }),
  })
}

// ─── Site Content (Tentang Kami, dll) ───

export async function getSiteContent(page = 'about') {
  if (await checkApi()) {
    return request<any>(`/site_content.php?page=${page}`)
  }
  return null
}

export async function adminUpdateSiteContent(page: string, content: any) {
  return request<{ success: boolean }>('/admin/site_content.php', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ page, content }),
  })
}

// ─── Admin API (wajib API) ───

export async function isApiAvailable() {
  return checkApi()
}

export async function adminLogin(username: string, password: string) {
  return request<{ success: boolean; token: string; username: string }>('/admin/login.php', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

// ─── Customer Auth (pembeli) ───

export type CustomerUser = {
  id: number
  name: string
  email: string
  phone: string | null
  birthdate: string | null
  gender: 'male' | 'female' | null
  avatar: string | null
}

export type UserAddress = {
  id: number
  label: string
  name: string | null
  phone: string | null
  city: string | null
  province: string | null
  district: string | null
  address: string
  rt_rw: string | null
  patokan: string | null
  postal_code: string | null
  maps_url: string | null
  latitude: number | null
  longitude: number | null
  is_default: boolean
}

type CustomerAuthResponse = {
  success: boolean
  token: string
  user: CustomerUser
}

export async function customerRegister(data: { name: string; email: string; phone?: string; password: string }) {
  return request<CustomerAuthResponse>('/register.php', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function customerLogin(email: string, password: string) {
  return request<CustomerAuthResponse>('/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function forgotPassword(email: string) {
  return request<{ success: boolean; dev_reset_url?: string | null }>('/forgot-password.php', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(email: string, token: string, password: string) {
  return request<{ success: boolean }>('/reset-password.php', {
    method: 'POST',
    body: JSON.stringify({ email, token, password }),
  })
}

export async function customerGoogleLogin(credential: string) {
  return request<CustomerAuthResponse>('/google.php', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export async function customerMe() {
  return request<{ user: CustomerUser }>('/me.php', { headers: customerAuthHeaders() })
}

export async function updateProfile(data: { name: string; phone?: string; birthdate?: string; gender?: string }) {
  return request<{ success: boolean; user: CustomerUser }>('/profile.php', {
    method: 'PUT',
    headers: customerAuthHeaders(),
    body: JSON.stringify(data),
  })
}

export async function uploadProfileAvatar(file: File) {
  const fd = new FormData()
  fd.append('avatar', file)
  return request<{ success: boolean; user: CustomerUser }>('/profile-avatar.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: fd,
  })
}

export async function changePassword(current_password: string, new_password: string) {
  return request<{ success: boolean }>('/change-password.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  })
}

export type AddressInput = {
  id?: number
  label?: string
  name?: string | null
  phone?: string | null
  city?: string | null
  province?: string | null
  district?: string | null
  address: string
  rt_rw?: string | null
  patokan?: string | null
  postal_code?: string | null
  maps_url?: string | null
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
}

export async function getAddresses() {
  return request<{ addresses: UserAddress[] }>('/addresses.php', { headers: customerAuthHeaders() })
}

export async function createAddress(data: AddressInput) {
  return request<{ success: boolean; address: UserAddress }>('/addresses.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify(data),
  })
}

export async function updateAddress(data: AddressInput) {
  return request<{ success: boolean; address: UserAddress }>('/addresses.php', {
    method: 'PUT',
    headers: customerAuthHeaders(),
    body: JSON.stringify(data),
  })
}

export async function deleteAddress(id: number) {
  return request<{ success: boolean }>(`/addresses.php?id=${id}`, {
    method: 'DELETE',
    headers: customerAuthHeaders(),
  })
}

export async function adminGetDashboard() {
  return request<any>('/admin/dashboard.php', { headers: authHeaders() })
}

export async function adminGetDashboardDetail() {
  return request<any>('/admin/dashboard-detail.php', { headers: authHeaders() })
}

export async function adminGetProducts() {
  const res = await request<any>('/admin/products.php', { headers: authHeaders() })
  return Array.isArray(res) ? res : (res.data ?? [])
}

export async function adminCreateProduct(data: {
  category_id: number
  name: string
  price: number
  image?: string
  imageFile?: File | null
  description: string
  weight: string
  stock: number
  serving_steps?: { title: string; description?: string }[]
}) {
  const hasFile = data.imageFile instanceof File
  let body: BodyInit

  if (hasFile) {
    const fd = new FormData()
    fd.append('category_id', String(data.category_id))
    fd.append('name', data.name)
    fd.append('price', String(data.price))
    fd.append('imageFile', data.imageFile!)
    if (data.image) fd.append('image', data.image)
    fd.append('description', data.description || '')
    fd.append('weight', data.weight || '')
    fd.append('stock', String(data.stock ?? 0))
    if (data.serving_steps) fd.append('serving_steps', JSON.stringify(data.serving_steps))
    body = fd
  } else {
    body = JSON.stringify({ ...data, image: data.image || '' })
  }

  return request<{ success: boolean; id: number; image?: string }>('/admin/products.php', {
    method: 'POST',
    headers: hasFile ? authHeaders() : { ...authHeaders() },
    body,
  })
}

export async function adminUpdateProduct(data: {
  id: number
  category_id: number
  name: string
  price: number
  image?: string
  imageFile?: File | null
  description: string
  weight: string
  stock: number
  serving_steps?: { title: string; description?: string }[]
}) {
  const hasFile = data.imageFile instanceof File
  let body: BodyInit
  let method = 'PUT'

  if (hasFile) {
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('id', String(data.id))
    fd.append('category_id', String(data.category_id))
    fd.append('name', data.name)
    fd.append('price', String(data.price))
    fd.append('imageFile', data.imageFile!)
    if (data.image) fd.append('image', data.image)
    fd.append('description', data.description || '')
    fd.append('weight', data.weight || '')
    fd.append('stock', String(data.stock ?? 0))
    if (data.serving_steps) fd.append('serving_steps', JSON.stringify(data.serving_steps))
    body = fd
    method = 'POST'
  } else {
    body = JSON.stringify({ ...data, image: data.image || '' })
  }

  return request<{ success: boolean }>('/admin/products.php', {
    method,
    headers: authHeaders(),
    body,
  })
}

// ─── Reviews ───

export type Review = {
  id: number
  product_id: number | null
  name: string
  rating: number
  review: string
  is_approved: number
  avatar?: string | null
  product_name?: string
  created_at: string
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (await checkApi()) {
    try {
      return request<Review[]>(`/reviews.php?product_id=${productId}`)
    } catch {
      return []
    }
  }
  return []
}

export async function getTestimonials(): Promise<Review[]> {
  if (await checkApi()) {
    try {
      return request<Review[]>(`/reviews.php?testimonials=1`)
    } catch {
      return []
    }
  }
  return []
}

export async function submitReview(data: {
  name: string
  rating: number
  review: string
  product_id?: string | null
}) {
  return request<{ success: boolean; message: string }>('/reviews.php', {
    method: 'POST',
    headers: customerAuthHeaders(),
    body: JSON.stringify(data),
  })
}

export async function adminGetReviews(): Promise<Review[]> {
  const res = await request<any>('/admin/reviews.php', { headers: authHeaders() })
  return Array.isArray(res) ? res : (res.data ?? [])
}

export async function adminToggleReview(id: number, is_approved: boolean) {
  return request<{ success: boolean }>('/admin/reviews.php', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, is_approved }),
  })
}

export async function adminDeleteReview(id: number) {
  return request<{ success: boolean }>(`/admin/reviews.php?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

// ─── Payment Config ───

export type PaymentMethod = {
  id: number
  method: 'transfer' | 'e-wallet' | 'qris' | 'cod' | 'midtrans'
  label: string
  account_name: string
  account_number: string
  bank_name: string
  qris_image: string
  logo: string
  is_active: number
  sort_order: number
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  if (await checkApi()) {
    return request<PaymentMethod[]>('/payments.php')
  }
  return []
}

export async function adminGetPaymentMethods(): Promise<PaymentMethod[]> {
  return request<PaymentMethod[]>('/admin/payments.php', { headers: authHeaders() })
}

export async function adminCreatePaymentMethod(data: Partial<PaymentMethod>) {
  return request<{ success: boolean; id: number }>('/admin/payments.php', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
}

export async function adminUpdatePaymentMethod(data: Partial<PaymentMethod> & { id: number }) {
  return request<{ success: boolean }>('/admin/payments.php', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
}

export async function adminDeletePaymentMethod(id: number) {
  return request<{ success: boolean }>(`/admin/payments.php?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function adminUploadQris(id: number, file: File) {
  const fd = new FormData()
  fd.append('id', String(id))
  fd.append('qrisFile', file)
  return request<{ success: boolean; qris_image: string }>('/admin/payments-upload.php', {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  })
}

export async function adminDeleteProduct(id: number) {
  return request<{ success: boolean }>(`/admin/products.php?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function adminGetOrders(status?: string) {
  const query = status ? `?status=${status}` : ''
  const res = await request<any>(`/admin/orders.php${query}`, { headers: authHeaders() })
  return Array.isArray(res) ? res : (res.data ?? [])
}

export async function adminUpdateOrderStatus(id: number, status: string) {
  return request<{ success: boolean }>('/admin/orders.php', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, status }),
  })
}

export async function adminDeleteOrder(id: number) {
  return request<{ success: boolean }>(`/admin/orders.php?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function adminGetCategories() {
  return request<any[]>('/admin/categories.php', { headers: authHeaders() })
}

export async function adminCreateCategory(name: string, image?: string, icon?: string, imageFile?: File | null) {
  const hasFile = imageFile instanceof File
  let body: BodyInit

  if (hasFile) {
    const fd = new FormData()
    fd.append('name', name)
    fd.append('icon', icon || 'Cookie')
    if (image) fd.append('image', image)
    fd.append('imageFile', imageFile)
    body = fd
  } else {
    body = JSON.stringify({ name, icon: icon || 'Cookie', image: image || '' })
  }

  return request<{ id: number; name: string; slug: string }>('/admin/categories.php', {
    method: 'POST',
    headers: authHeaders(),
    body,
  })
}

export async function adminUpdateCategory(id: number, name: string, icon?: string, image?: string, imageFile?: File | null) {
  const hasFile = imageFile instanceof File
  let body: BodyInit
  let method = 'PUT'

  if (hasFile) {
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('id', String(id))
    fd.append('name', name)
    if (icon) fd.append('icon', icon)
    if (image) fd.append('image', image)
    fd.append('imageFile', imageFile)
    body = fd
    method = 'POST'
  } else {
    body = JSON.stringify({ id, name, icon, ...(image !== undefined ? { image } : {}) })
  }

  return request<{ id: number; name: string; slug: string }>('/admin/categories.php', {
    method,
    headers: authHeaders(),
    body,
  })
}

export async function adminDeleteCategory(id: number) {
  return request<{ success: boolean }>(`/admin/categories.php?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function adminUploadFile(file: File): Promise<{ success: boolean; url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${API_BASE}/admin/upload.php`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  const data = await res.json()
  if (data.url && data.url.startsWith('uploads/')) {
    data.url = `${API_BASE}/${data.url}`
  }
  return data
}

// ─── Promos ───

export type Promo = {
  id: number
  code: string
  type: 'fixed' | 'percent'
  value: number
  min_order: number
  max_discount: number
  is_active: number
}

export async function getPromos(): Promise<Promo[]> {
  if (await checkApi()) {
    try {
      return await request<Promo[]>('/promos.php')
    } catch {
      return []
    }
  }
  return []
}

export async function adminGetPromos(): Promise<Promo[]> {
  return request<Promo[]>('/admin/promos.php', { headers: authHeaders() })
}

export async function adminCreatePromo(data: {
  code: string
  type: 'fixed' | 'percent'
  value: number
  min_order: number
  max_discount: number
  is_active: boolean
}) {
  return request<{ success: boolean; id: number }>('/admin/promos.php', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
}

export async function adminUpdatePromo(data: {
  id: number
  code: string
  type: 'fixed' | 'percent'
  value: number
  min_order: number
  max_discount: number
  is_active: boolean
}) {
  return request<{ success: boolean }>('/admin/promos.php', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
}

export async function adminDeletePromo(id: number) {
  return request<{ success: boolean }>(`/admin/promos.php?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
