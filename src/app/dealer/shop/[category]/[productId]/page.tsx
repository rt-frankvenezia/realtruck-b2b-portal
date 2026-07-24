import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { AddToCartButton } from '@/components/dealer/AddToCartButton'
import { ProductCard } from '@/components/dealer/ProductCard'
import { ShopCartLink } from '@/components/dealer/ShopCartLink'
import { formatCurrency, CATALOG_INVENTORY_STATUS_LABEL, CATALOG_INVENTORY_STATUS_VARIANT } from '@/lib/status-labels'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; productId: string }>
}) {
  const { category: categorySlug, productId } = await params

  const supabase = await createClient()
  const { data: category } = await supabase.from('product_categories').select('*').eq('slug', categorySlug).maybeSingle()
  if (!category) notFound()

  const { data: product } = await supabase.from('catalog_products').select('*').eq('id', productId).maybeSingle()
  if (!product || product.category_id !== category.id) notFound()

  const { data: related } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('category_id', category.id)
    .neq('id', product.id)
    .limit(3)

  const specifications = (product.specifications ?? {}) as Record<string, string>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dealer/shop" className="hover:text-foreground">
            Shop
          </Link>
          <span>/</span>
          <Link href={`/dealer/shop/${categorySlug}`} className="hover:text-foreground">
            {category.name}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{product.name}</span>
        </div>
        <ShopCartLink />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="flex aspect-4/3 items-center justify-center rounded-lg border bg-muted">
            <Package size={96} className="text-muted-foreground/40" />
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          {Object.keys(specifications).length > 0 && (
            <div className="mt-10 flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Specifications</h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4 border-b pb-2">
                    <span className="text-sm font-medium text-muted-foreground">{key}</span>
                    <span className="text-right text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {related && related.length > 0 && (
            <div className="mt-10 flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Related Products</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} categorySlug={categorySlug} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{product.brand}</p>
              <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
              <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Your Dealer Price</p>
              <p className="text-3xl font-bold">{formatCurrency(product.dealer_price)}</p>
              <p className="mt-1 text-sm text-muted-foreground">MAP: {formatCurrency(product.map_price)}</p>
            </div>

            <Badge variant={CATALOG_INVENTORY_STATUS_VARIANT[product.inventory_status]} className="w-fit">
              {CATALOG_INVENTORY_STATUS_LABEL[product.inventory_status]}
            </Badge>

            <div className="border-t pt-4">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                brand={product.brand}
                sku={product.sku}
                unitPrice={product.dealer_price}
                categorySlug={categorySlug}
                disabled={product.inventory_status === 'discontinued'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
