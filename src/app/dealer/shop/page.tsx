import Link from 'next/link'
import { Package } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

export default async function ShopPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  // catalog_products_public works for both anonymous and authenticated
  // sessions and the count itself isn't sensitive, so there's no need to
  // branch this query on auth state the way the category/product detail
  // pages do for pricing.
  const { data: categories } = await supabase.from('product_categories').select('*, catalog_products_public(count)').order('sort_order')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Shop RealTruck Wholesale</h1>
        <p className="text-muted-foreground">
          {user ? 'Browse the catalog and place an order at your dealer pricing.' : 'Browse the catalog. Log in to see your dealer pricing and place an order.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(categories ?? []).map((category) => {
          const count = category.catalog_products_public[0]?.count ?? 0
          return (
            <Link key={category.id} href={`/dealer/shop/${category.slug}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Package size={24} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {count} product{count === 1 ? '' : 's'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
