import { useEffect, useState } from 'react'
import { useCartStore } from '../store/cartStore'
import { getOrdersByPhone } from '../api/client'
import { isAwaitingConfirm } from '../utils/orderStatus'
import type { Order } from '../types'

const NOTIFIED_KEY = 'ungkepan-sn-notified-shipped'

function getNotified(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')
  } catch {
    return []
  }
}

function saveNotified(ids: string[]) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids))
}

export function useShippedNotifications() {
  const localOrders = useCartStore((s) => s.orders)
  const [awaiting, setAwaiting] = useState<Order[]>(localOrders.filter(isAwaitingConfirm))
  const [newShipped, setNewShipped] = useState<Order[]>([])

  useEffect(() => {
    let cancelled = false

    setAwaiting(localOrders.filter(isAwaitingConfirm))

    const run = () => {
      const phones = [...new Set(localOrders.map((o) => o.phone))]
      if (phones.length === 0) return

      Promise.all(phones.map((p) => getOrdersByPhone(p).catch(() => []))).then((results) => {
        if (cancelled) return
        const apiOrders = results.flat()
        if (apiOrders.length === 0) return

        const merged = localOrders.flatMap((local) => {
          const match = apiOrders.find((a: any) => a.order_code === local.id)
          return match ? [{ ...local, status: match.status }] : []
        })

        const awaitingNow = merged.filter(isAwaitingConfirm)
        setAwaiting(awaitingNow)

        const notified = getNotified()
        const fresh = awaitingNow.filter((o) => !notified.includes(o.id))
        if (fresh.length > 0) {
          setNewShipped((prev) => [...prev, ...fresh.filter((f) => !prev.some((p) => p.id === f.id))])
          saveNotified([...notified, ...fresh.map((o) => o.id)])
        }
      })
    }

    run()
    const timer = setInterval(run, 30000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [localOrders])

  const dismiss = () => setNewShipped([])

  return { awaiting, newShipped, dismiss }
}