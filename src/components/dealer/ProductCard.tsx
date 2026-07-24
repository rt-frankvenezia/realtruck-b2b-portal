import Link from 'next/link'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/status-labels'
import { CATALOG_INVENTORY_STATUS_LABEL, CATALOG_INVENTORY_STATUS_VARIANT } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type Product = Pick<
  Database['public']['Tables']['catalog_products']['Row'],
  'id' | 'name' | 'brand' | 'sku' | 'dealer_price' | 'map_price' | 'inventory_status'
>

export function ProductCard({ product, categorySlug }: { product: Product; categorySlug: string }) {
  return (
    <Link href={`/dealer/shop/${categorySlug}/${product.id}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="flex aspect-4/3 items-center justify-center border-b bg-muted">
          <Package size={56} className="text-muted-foreground/40" />
        </div>
        <CardContent className="flex flex-col gap-2 pt-4">
          <p className="text-xs font-semibold text-muted-foreground">{product.brand}</p>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold">{product.name}</h3>
          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          <div className="mt-1">
            <div className="text-xl font-bold">{formatCurrency(product.dealer_price)}</div>
            <div className="text-xs text-muted-foreground">MAP: {formatCurrency(product.map_price)}</div>
          </div>
          <Badge variant={CATALOG_INVENTORY_STATUS_VARIANT[product.inventory_status]} className="mt-1 w-fit">
            {CATALOG_INVENTORY_STATUS_LABEL[product.inventory_status]}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
