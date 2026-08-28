'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecentlyViewedIds } from '@/lib/recently-viewed'
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

export function RecentlyViewedSection({ showDealerPricing }: { showDealerPricing: boolean }) {
  const [products, setProducts] = useState<ViewedProduct[] | null>(null)

  useEffect(() => {
    const ids = getRecentlyViewedIds()
    const supabase = createClient()
    // Route the empty case through the same .then() as the real query
    // (rather than an early setState) so state only ever updates from an
    // async callback, not synchronously within the effect body.
    const query =
      ids.length === 0
        ? Promise.resolve({ data: [] as ViewedProduct[] })
        : showDealerPricing
          ? supabase.from('catalog_products').select('*, product_categories(slug)').in('id', ids)
          : supabase.from('catalog_products_public').select('*, product_categories(slug)').in('id', ids)
    query.then(({ data }) => {
      const rows = (data ?? []) as ViewedProduct[]
      // Preserve most-recently-viewed-first order — .in() doesn't guarantee it.
      const byId = new Map(rows.map((p) => [p.id, p]))
      setProducts(ids.map((id) => byId.get(id)).filter((p): p is ViewedProduct => Boolean(p)))
    })
  }, [showDealerPricing])

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
