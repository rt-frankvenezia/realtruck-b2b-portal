'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { CAP_OPTIONS, findCapModel } from '@/lib/catalog'

export type CartItem = {
  lineId: string
  capModelId: string
  color: string
  finish: string
  optionIds: string[]
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'lineId'>) => void
  removeItem: (lineId: string) => void
  clear: () => void
  itemTotal: (item: CartItem) => number
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'realtruck-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setItems(JSON.parse(raw))
      } catch {
        // ignore malformed cart data
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  function addItem(item: Omit<CartItem, 'lineId'>) {
    setItems((prev) => [...prev, { ...item, lineId: crypto.randomUUID() }])
  }

  function removeItem(lineId: string) {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId))
  }

  function clear() {
    setItems([])
  }

  function itemTotal(item: CartItem): number {
    const model = findCapModel(item.capModelId)
    const base = model?.msrp ?? 0
    const options = item.optionIds.reduce((sum, id) => sum + (CAP_OPTIONS.find((o) => o.id === id)?.price ?? 0), 0)
    return base + options
  }

  const total = items.reduce((sum, item) => sum + itemTotal(item), 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, itemTotal, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
