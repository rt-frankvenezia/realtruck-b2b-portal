'use client'

// Wholesale ordering cart — separate from the customer-facing CartContext.
// Snapshots product fields at add-time. When an item has a pricingTiers
// schedule, unitPrice is recomputed from that schedule whenever the quantity
// changes; items without tiers (no pricing group assigned) keep the static
// dealer_price snapshot.

import { createContext, useContext, useEffect, useState } from 'react'
import { resolveEffectivePrice, type PricingTier } from '@/lib/pricing'

export type DealerCartItem = {
  productId: string
  name: string
  brand: string
  sku: string
  /** Effective unit price at the current quantity (recomputed on qty change when tiers are set). */
  unitPrice: number
  /** MAP price — needed to recompute unitPrice from tiers. Null for legacy static-price items. */
  mapPrice: number | null
  /** Volume tier schedule from the dealer's pricing group. Null when no pricing group is assigned. */
  pricingTiers: PricingTier[] | null
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
        const newQty = existing.quantity + quantity
        const newUnitPrice =
          existing.pricingTiers && existing.mapPrice != null
            ? resolveEffectivePrice(existing.mapPrice, existing.pricingTiers, newQty)
            : existing.unitPrice
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: newQty, unitPrice: newUnitPrice }
            : i,
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i
        const newUnitPrice =
          i.pricingTiers && i.mapPrice != null
            ? resolveEffectivePrice(i.mapPrice, i.pricingTiers, quantity)
            : i.unitPrice
        return { ...i, quantity, unitPrice: newUnitPrice }
      }),
    )
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
