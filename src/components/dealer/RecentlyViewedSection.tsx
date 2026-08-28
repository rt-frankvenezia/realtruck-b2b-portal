'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecentlyViewedIds, seedRecentlyViewed } from '@/lib/recently-viewed'
import { ProductCard } from '@/components/dealer/ProductCard'

type ViewedProduct = {
  id: string
  name: string
  brand: string
  sku: string
  map_price: number
  inventory_status: 'in_stock' | 'limited_stock' | 'backorder' | 'discontinued'
  dealer_price?: number | null
  product_categories: { slug: string } | null
}

// Shown the first time a user has no real history yet, so the section
// isn't empty — persisted via seedRecentlyViewed so it then behaves exactly
// like a real recorded list (bumps to the front on an actual view, ages
// out past MAX_ITEMS as the user browses more).
const FAKE_SEED_COUNT = 4

export function RecentlyViewedSection({ userId, showDealerPricing }: { userId: string; showDealerPricing: boolean }) {
  const [products, setProducts] = useState<ViewedProduct[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function load() {
      const ids = getRecentlyViewedIds(userId)

      if (ids && ids.length > 0) {
        const { data } = await (showDealerPricing
          ? supabase.from('catalog_products').select('*, product_categories(slug)').in('id', ids)
          : supabase.from('catalog_products_public').select('*, product_categories(slug)').in('id', ids))
        const rows = (data ?? []) as ViewedProduct[]
        // Preserve most-recently-viewed-first order — .in() doesn't guarantee it.
        const byId = new Map(rows.map((p) => [p.id, p]))
        const ordered = ids.map((id) => byId.get(id)).filter((p): p is ViewedProduct => Boolean(p))
        if (!cancelled) setProducts(ordered)
        return
      }

      const { data: pool } = await (showDealerPricing
        ? supabase.from('catalog_products').select('*, product_categories(slug)').order('id')
        : supabase.from('catalog_products_public').select('*, product_categories(slug)').order('id'))
      const rows = (pool ?? []) as ViewedProduct[]
      const picked = pickDeterministicSample(rows, userId, FAKE_SEED_COUNT)
      seedRecentlyViewed(userId, picked.map((p) => p.id))
      if (!cancelled) setProducts(picked)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId, showDealerPricing])

  // Avoid a flash of the empty state before localStorage has been read.
  if (products === null) return null

  return (
    <section className="mx-auto max-w-[1440px] px-8 py-14">
      <h2 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Recently Viewed</h2>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t viewed any products yet.{' '}
          <Link href="/dealer/shop" className="font-semibold text-primary hover:underline">
            Browse the shop
          </Link>{' '}
          to get started.
        </p>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-2">
          {products.map((product) => (
            <div key={product.id} className="w-64 shrink-0">
              <ProductCard product={product} categorySlug={product.product_categories?.slug ?? ''} showDealerPricing={showDealerPricing} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function pickDeterministicSample<T>(pool: T[], seed: string, count: number): T[] {
  const n = pool.length
  if (n === 0) return []
  const start = hashString(seed) % n
  const size = Math.min(count, n)
  return Array.from({ length: size }, (_, i) => pool[(start + i) % n])
}

function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}
