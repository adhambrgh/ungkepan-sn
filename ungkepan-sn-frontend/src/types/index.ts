export interface Product {
  id: string
  name: string
  category: string
  categoryName?: string
  price: number
  image: string
  description: string
  weight: string
  stock: number
  is_featured?: number
  variants?: string[]
  avg_rating?: number
  review_count?: number
  serving_steps?: ServingStep[]
}

export interface ServingStep {
  title: string
  description?: string
}

export interface CartItem {
  product: Product
  quantity: number
  selected: boolean
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  customerName: string
  phone: string
  address: string
  city: string
  notes: string
  shippingMethod: string
  paymentMethod: string
  status: 'pending' | 'processed' | 'shipped' | 'completed'
  createdAt: string
}

import type { ElementType } from 'react'

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

export type Category = {
  id: string
  name: string
  icon: ElementType
  image: string
}
