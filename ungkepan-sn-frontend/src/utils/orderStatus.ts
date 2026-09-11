import type { Order } from '../types'

export function isAwaitingConfirm(order: Order): boolean {
  return order.status === 'shipped' || (order.shippingMethod === 'ambil' && order.status === 'processed')
}