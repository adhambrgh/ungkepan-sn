import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, Order } from '../types'
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartServer,
  type ServerCartItem,
} from '../api/client'
import { resolveImage } from '../api/client'
import { useAuthStore } from './authStore'

export type DiscountInfo = {
  code: string
  type: 'fixed' | 'percent'
  value: number
}

function serverToCartItem(s: ServerCartItem): CartItem {
  return {
    quantity: s.quantity,
    selected: s.selected,
    product: {
      id: String(s.product.id),
      name: s.product.name,
      category: String(s.product.category_id ?? ''),
      price: Number(s.product.price),
      image: resolveImage(s.product.image),
      description: s.product.description ?? '',
      weight: s.product.weight ?? '',
      stock: Number(s.product.stock ?? 0),
      is_featured: Number(s.product.is_featured ?? 0),
    },
  }
}

interface CartStore {
  items: CartItem[]
  orders: Order[]
  discount: number
  discountInfo: DiscountInfo | null
  addItem: (product: Product) => void
  addItems: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  toggleSelected: (productId: string) => void
  setAllSelected: (selected: boolean) => void
  applyDiscount: (amount: number, info?: DiscountInfo) => void
  clearDiscount: () => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: () => number
  getTotalItems: () => number
  addOrder: (order: Order) => void
  updateOrderStatus: (id: string, status: Order['status']) => void
  hydrateFromServer: () => Promise<void>
}

const authed = () => !!useAuthStore.getState().token

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      orders: [],
      discount: 0,
      discountInfo: null,

      addItem: (product: Product) => {
        const existing = get().items.find((i) => i.product.id === product.id)
        const newQty = existing ? existing.quantity + 1 : 1

        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1, selected: true }
                : i
            ),
          }))
        } else {
          set((state) => ({ items: [...state.items, { product, quantity: 1, selected: true }] }))
        }

        if (authed()) addCartItem(product.id, newQty, true).catch(() => {})
      },

      addItems: (product: Product, quantity: number) => {
        if (quantity < 1) return
        const existing = get().items.find((i) => i.product.id === product.id)
        const nextQty = existing ? existing.quantity + quantity : quantity
        set((state) => ({
          items: existing
            ? state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity, selected: true }
                  : i
              )
            : [...state.items, { product, quantity, selected: true }],
        }))
        if (authed()) addCartItem(product.id, nextQty, true).catch(() => {})
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }))
        if (authed()) removeCartItem(productId).catch(() => {})
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity < 1) return
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }))
        if (authed()) updateCartItem(productId, { quantity }).catch(() => {})
      },

      toggleSelected: (productId: string) => {
        const item = get().items.find((i) => i.product.id === productId)
        const next = item ? !item.selected : true
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, selected: next } : i
          ),
        }))
        if (authed()) updateCartItem(productId, { selected: next }).catch(() => {})
      },

      setAllSelected: (selected: boolean) => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected })),
        }))
        if (authed()) {
          const items = get().items
          if (selected) {
            items.forEach((i) =>
              updateCartItem(i.product.id, { selected: true }).catch(() => {})
            )
          } else {
            items.forEach((i) =>
              updateCartItem(i.product.id, { selected: false }).catch(() => {})
            )
          }
        }
      },

      clearCart: () => {
        set({ items: [], discount: 0, discountInfo: null })
        if (authed()) clearCartServer().catch(() => {})
      },

      getSubtotal: () => {
        return get().items
          .filter((i) => i.selected)
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      },

      applyDiscount: (amount, info) => {
        set((state) => {
          const subtotal = state.items
            .filter((i) => i.selected)
            .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
          const capped = Math.min(Math.max(amount, 0), subtotal)
          return { discount: capped, discountInfo: capped > 0 ? info ?? null : null }
        })
      },

      clearDiscount: () => set({ discount: 0, discountInfo: null }),

      getTotal: () => {
        const subtotal = get().items
          .filter((i) => i.selected)
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
        return Math.max(subtotal - get().discount, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      addOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }))
      },

      updateOrderStatus: (id: string, status: Order['status']) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }))
      },

      hydrateFromServer: async () => {
        if (!authed()) return
        try {
          const res = await getCart()
          set({ items: res.items.map(serverToCartItem) })
        } catch {
          // abaikan, biarkan state lokal
        }
      },
    }),
    {
      name: 'ungkepan-sn-cart',
      partialize: (state) => ({
        items: state.items,
        orders: state.orders,
      }),
    }
  )
)
