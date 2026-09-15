import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Package, ShieldCheck, Zap } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from '@/components/dealer/AddToCartButton'
import { VolumePricingPanel } from '@/components/dealer/VolumePricingPanel'
import { ProductCard } from '@/components/dealer/ProductCard'
import { RecordRecentlyViewed } from '@/components/dealer/RecordRecentlyViewed'
import { formatCurrency, CATALOG_INVENTORY_STATUS_LABEL, CATALOG_INVENTORY_STATUS_VARIANT } from '@/lib/status-labels'
import type { PricingTier } from '@/lib/pricing'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; productId: string }>
}) {
  const { category: categorySlug, productId } = await params

  const user = await getCurrentUser()
  const showDealerPricing = Boolean(user)
  const supabase = await createClient()
  const { data: category } = await supabase.from('product_categories').select('*').eq('slug', categorySlug).maybeSingle()
  if (!category) notFound()

  // Parallel fetch: product + related + inventory + (if logged in) company
  const [productRes, relatedRes, inventoryRes, companyRes] = await Promise.all([
    showDealerPricing
      ? supabase.from('catalog_products').select('*').eq('id', productId).maybeSingle()
      : supabase.from('catalog_products_public').select('*').eq('id', productId).maybeSingle(),
    showDealerPricing
      ? supabase.from('catalog_products').select('*').eq('category_id', category.id).neq('id', productId).limit(3)
      : supabase.from('catalog_products_public').select('*').eq('category_id', category.id).neq('id', productId).limit(3),
    supabase
      .from('catalog_product_inventory')
      .select('quantity_on_hand, fulfillment_locations(name, city, state, supports_rapid_ship, sort_order)')
      .eq('catalog_product_id', productId)
      .order('sort_order', { referencedTable: 'fulfillment_locations' }),
    showDealerPricing && user?.profile.company_id
      ? supabase.from('companies').select('pricing_group_id').eq('id', user.profile.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const product = productRes.data
  if (!product || product.category_id !== category.id) notFound()

  const availability = inventoryRes.data ?? []
  const rapidShipEligible = availability.some((row) => row.quantity_on_hand > 0 && row.fulfillment_locations?.supports_rapid_ship)
  const specifications = (product.specifications ?? {}) as Record<string, string>
  const warranty = specifications.warranty

  const dealerPrice: number | null =
    showDealerPricing && 'dealer_price' in product ? (product as { dealer_price: number }).dealer_price : null

  // Pricing group schedule — fetched only for logged-in dealers with an assigned group
  const pricingGroupId = companyRes.data?.pricing_group_id ?? null
  let pricingTiers: PricingTier[] | null = null

  if (pricingGroupId && showDealerPricing) {
    const productLine = (product as { product_line?: string | null }).product_line ?? undefined
    const { data: schedule } = await supabase.rpc('get_pricing_schedule', {
      p_pricing_group_id: pricingGroupId,
      p_brand: product.brand,
      p_category: categorySlug,
      p_product_line: productLine,
    })
    if (schedule && schedule.length > 0) {
      pricingTiers = schedule.map((row) => ({
        minQty: row.min_quantity,
        discountPercent: Number(row.discount_percent),
      }))
    }
  }

  // mapPrice is the base for group-discounted dealer pricing
  const mapPrice = product.map_price

  return (
    <div className="flex flex-col gap-6">
      <RecordRecentlyViewed userId={user?.profile.id} productId={product.id} />
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

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="flex aspect-4/3 items-center justify-center rounded-lg border bg-muted">
            <Package size={96} className="text-muted-foreground/40" />
          </div>

          {product.highlights.length > 0 && (
            <div className="mt-10 flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Product Highlights</h2>
              <ul className="flex flex-col gap-2">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          {warranty && (
            <div className="mt-10 flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Warranty</h2>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">{warranty}, backed by RealTruck.</p>
                  <Link href="/dealer/warranties" className="mt-1 inline-block font-semibold text-primary hover:underline">
                    View warranty details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {relatedRes.data && relatedRes.data.length > 0 && (
            <div className="mt-10 flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Related Products</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {relatedRes.data.map((p) => (
                  <ProductCard key={p.id} product={p} categorySlug={categorySlug} showDealerPricing={showDealerPricing} />
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

            <div className="flex flex-wrap gap-2">
              <Badge variant={CATALOG_INVENTORY_STATUS_VARIANT[product.inventory_status]} className="w-fit">
                {CATALOG_INVENTORY_STATUS_LABEL[product.inventory_status]}
              </Badge>
              {rapidShipEligible && (
                <Badge variant="success" className="w-fit gap-1">
                  <Zap size={12} />
                  Rapid Ship Eligible
                </Badge>
              )}
            </div>

            {/* Pricing + Add to Cart */}
            {pricingTiers ? (
              // Dealer with a pricing group — show volume pricing panel
              <VolumePricingPanel
                productId={product.id}
                name={product.name}
                brand={product.brand}
                sku={product.sku}
                categorySlug={categorySlug}
                mapPrice={mapPrice}
                pricingTiers={pricingTiers}
                disabled={product.inventory_status === 'discontinued'}
              />
            ) : dealerPrice != null ? (
              // Dealer without a pricing group — static dealer_price
              <>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Your Dealer Price</p>
                  <p className="text-3xl font-bold">{formatCurrency(dealerPrice)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">MAP: {formatCurrency(mapPrice)}</p>
                </div>
                <div className="border-t pt-4">
                  <AddToCartButton
                    productId={product.id}
                    name={product.name}
                    brand={product.brand}
                    sku={product.sku}
                    unitPrice={dealerPrice}
                    categorySlug={categorySlug}
                    disabled={product.inventory_status === 'discontinued'}
                  />
                </div>
              </>
            ) : (
              // Anonymous visitor
              <>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-bold">{formatCurrency(mapPrice)}</p>
                </div>
                <div className="border-t pt-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Log in to see your dealer price and place an order.</p>
                    <Button render={<Link href="/login" />} nativeButton={false}>
                      Log In
                    </Button>
                  </div>
                </div>
              </>
            )}

            {availability.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-semibold">Fulfillment Availability</p>
                <div className="flex flex-col divide-y rounded-md border">
                  {availability.map((row) => {
                    const loc = row.fulfillment_locations
                    if (!loc) return null
                    const inStock = row.quantity_on_hand > 0
                    return (
                      <div key={loc.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{loc.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {loc.city}, {loc.state}
                            {loc.supports_rapid_ship ? ' · Rapid Ship hub' : ''}
                          </div>
                        </div>
                        <span className={inStock ? 'font-semibold text-green-700' : 'text-muted-foreground'}>
                          {inStock ? `${row.quantity_on_hand} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {rapidShipEligible
                    ? 'Ships from a Rapid Ship location — arrives faster.'
                    : 'Ships from a standard fulfillment location.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
