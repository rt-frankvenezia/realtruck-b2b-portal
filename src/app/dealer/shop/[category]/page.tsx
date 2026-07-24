import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ProductCard } from '@/components/dealer/ProductCard'
import { ShopCartLink } from '@/components/dealer/ShopCartLink'
import { CATALOG_INVENTORY_STATUS_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type InventoryStatus = Database['public']['Enums']['catalog_inventory_status']
const AVAILABILITY_OPTIONS: InventoryStatus[] = ['in_stock', 'limited_stock', 'backorder']

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ brand?: string; availability?: string }>
}) {
  const { category: categorySlug } = await params
  const { brand, availability } = await searchParams

  const supabase = await createClient()
  const { data: category } = await supabase.from('product_categories').select('*').eq('slug', categorySlug).maybeSingle()
  if (!category) notFound()

  const { data: allProducts } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('category_id', category.id)
    .order('name')

  const products = allProducts ?? []
  const availableBrands = Array.from(new Set(products.map((p) => p.brand))).sort()

  const filtered = products.filter((p) => {
    if (brand && p.brand !== brand) return false
    if (availability && p.inventory_status !== availability) return false
    return true
  })

  const baseParams = new URLSearchParams()
  if (brand) baseParams.set('brand', brand)
  if (availability) baseParams.set('availability', availability)

  function filterHref(key: 'brand' | 'availability', value: string) {
    const params = new URLSearchParams(baseParams)
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const qs = params.toString()
    return `/dealer/shop/${categorySlug}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{category.name}</h1>
          <p className="text-muted-foreground">
            {filtered.length} product{filtered.length === 1 ? '' : 's'} available
          </p>
        </div>
        <ShopCartLink />
      </div>

      <div className="flex gap-8">
        <aside className="w-56 shrink-0">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Brand</h3>
              <div className="flex flex-col gap-2">
                {availableBrands.map((b) => (
                  <Link
                    key={b}
                    href={filterHref('brand', b)}
                    className={`text-sm ${brand === b ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Availability</h3>
              <div className="flex flex-col gap-2">
                {AVAILABILITY_OPTIONS.map((status) => (
                  <Link
                    key={status}
                    href={filterHref('availability', status)}
                    className={`text-sm ${availability === status ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {CATALOG_INVENTORY_STATUS_LABEL[status]}
                  </Link>
                ))}
              </div>
            </div>
            {(brand || availability) && (
              <Link href={`/dealer/shop/${categorySlug}`} className="text-sm font-semibold text-primary">
                Clear filters
              </Link>
            )}
          </div>
        </aside>

        <div className="flex-1">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Package size={48} className="text-muted-foreground/40" />
                <p className="font-semibold">No products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters to see more results.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} categorySlug={categorySlug} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
