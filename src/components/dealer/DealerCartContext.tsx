'use client'

// Wholesale ordering cart — separate from the customer-facing CartContext
// (a different product domain: cap-builder configurations vs. wholesale
// accessory SKUs) and deliberately not shared with it, same architectural
// separation the original prototype kept between its dealer and customer
// flows. Snapshots product fields at add-time (rather than storing just a
// product_id and re-fetching) since there's no static catalog import to
// resolve prices from client-side the way the customer cart resolves
// against catalog.ts — catalog_products lives in the database.

import { createContext, useContext, useEffect, useState } from 'react'

export type DealerCartItem = {
  productId: string
  name: string
  brand: string
  sku: string
  unitPrice: number
  categorySlug: string
  quantity: number
}

type DealerCartContextValue = {
  items: DealerCartItem[]
  addItem: (item: Omit<DealerCartItem, 'quantity'>, quantity: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  subtotal: number
  itemCount: number
}

const DealerCartContext = createContext<DealerCartContextValue | null>(null)
const STORAGE_KEY = 'realtruck-dealer-cart'

export function DealerCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DealerCartItem[]>([])
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

  function addItem(item: Omit<DealerCartItem, 'quantity'>, quantity: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i))
      }
      return [...prev, { ...item, quantity }]
    })
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function clear() {
    setItems([])
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <DealerCartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, subtotal, itemCount }}>
      {children}
    </DealerCartContext.Provider>
  )
}

export function useDealerCart(): DealerCartContextValue {
  const ctx = useContext(DealerCartContext)
  if (!ctx) throw new Error('useDealerCart must be used within a DealerCartProvider')
  return ctx
}
