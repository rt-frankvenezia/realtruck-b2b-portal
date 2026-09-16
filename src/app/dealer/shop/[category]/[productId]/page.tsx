import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, CheckCircle2, Package, ShieldCheck, Star, Truck } from 'lucide-react'
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

        <div className="w-full shrink-0 lg:w-[440px]">
          <div className="flex flex-col">
            {/* Product identity */}
            <div className="pb-5">
              <h1 className="font-brand text-2xl uppercase leading-tight">
                {product.brand} {product.name}
              </h1>
              <div className="mt-2 flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className="text-yellow-400" fill="currentColor" />
                ))}
                <span className="text-sm font-semibold">4.8</span>
                <span className="text-sm text-muted-foreground">(24)</span>
              </div>
              {product.inventory_status === 'discontinued' && (
                <Badge variant={CATALOG_INVENTORY_STATUS_VARIANT['discontinued']} className="mt-2 w-fit">
                  {CATALOG_INVENTORY_STATUS_LABEL['discontinued']}
                </Badge>
              )}
            </div>

            {/* Shared sections rendered between price and cart across all paths */}
            {(() => {
              const partAndFitSection = (
                <div className="mt-5">
                  <p className="text-sm text-muted-foreground">PART #: {product.sku}</p>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Guaranteed Fit</p>
                      <p className="text-sm text-muted-foreground">2024 Dodge Ram 1500, 5&apos;7&quot; Bed</p>
                      <span className="mt-0.5 cursor-pointer text-sm font-medium text-primary hover:underline">
                        Change vehicle
                      </span>
                    </div>
                  </div>
                </div>
              )

              const rapidShipSection = rapidShipEligible ? (
                <div className="mt-4 flex items-start gap-3">
                  <Truck size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">RapidShip Ready</p>
                    <p className="text-xs text-muted-foreground">
                      Free Shipping — Ships Wednesday, order within{' '}
                      <span className="font-semibold text-foreground">16h 54m 35s</span>
                    </p>
                  </div>
                </div>
              ) : null

              const availabilitySection = availability.length > 0 ? (
                <div className="mt-5 border-t pt-4">
                  <p className="mb-2 text-sm font-semibold">Availability</p>
                  <div className="flex flex-col gap-1.5">
                    {availability.map((row) => {
                      const loc = row.fulfillment_locations
                      if (!loc) return null
                      const inStock = row.quantity_on_hand > 0
                      return (
                        <div key={loc.name} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="truncate text-muted-foreground">{loc.city}, {loc.state} Warehouse</span>
                          </div>
                          <span className={`shrink-0 text-xs font-semibold ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                            {inStock ? 'In stock' : 'Out of stock'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null

              if (pricingTiers) {
                return (
                  <VolumePricingPanel
                    productId={product.id}
                    name={product.name}
                    brand={product.brand}
                    sku={product.sku}
                    categorySlug={categorySlug}
                    mapPrice={mapPrice}
                    pricingTiers={pricingTiers}
                    disabled={product.inventory_status === 'discontinued'}
                  >
                    {partAndFitSection}
                    {rapidShipSection}
                    {availabilitySection}
                  </VolumePricingPanel>
                )
              }

              if (dealerPrice != null) {
                return (
                  <>
                    <div className="border-t py-4">
                      <div className="flex divide-x">
                        <div className="pr-6">
                          <p className="text-xs text-muted-foreground">Your Price</p>
                          <p className="text-2xl font-bold">{formatCurrency(dealerPrice)}</p>
                        </div>
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground">MAP</p>
                          <p className="text-xl font-medium text-muted-foreground">{formatCurrency(mapPrice)}</p>
                        </div>
                      </div>
                    </div>
                    {partAndFitSection}
                    {rapidShipSection}
                    {availabilitySection}
                    <div className="mt-5">
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
                )
              }

              return (
                <>
                  <div className="border-t py-4">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-2xl font-bold">{formatCurrency(mapPrice)}</p>
                  </div>
                  {partAndFitSection}
                  {rapidShipSection}
                  {availabilitySection}
                  <div className="border-t py-4 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">Log in to see your dealer price and place an order.</p>
                    <Button render={<Link href="/login" />} nativeButton={false} className="w-full">
                      Log In
                    </Button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
