import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ban, Check, CheckCircle2, Package, ShieldCheck, Star, Truck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from '@/components/dealer/AddToCartButton'
import { VolumePricingPanel } from '@/components/dealer/VolumePricingPanel'
import { ProductCard } from '@/components/dealer/ProductCard'
import { RecordRecentlyViewed } from '@/components/dealer/RecordRecentlyViewed'
import { FitmentTable } from '@/components/dealer/FitmentTable'
import { LeerConfigurator } from '@/components/dealer/LeerConfigurator'
import { formatCurrency, CATALOG_INVENTORY_STATUS_LABEL, CATALOG_INVENTORY_STATUS_VARIANT } from '@/lib/status-labels'
import type { PricingTier } from '@/lib/pricing'
import catalogData from '@/lib/leer/data/catalog.json'
import kit_10113214 from '@/lib/leer/data/kits/10113214.json'
import bom_10113214 from '@/lib/leer/data/kits/10113214.bom.json'
import kit_3488646 from '@/lib/leer/data/kits/3488646.json'
import bom_3488646 from '@/lib/leer/data/kits/3488646.bom.json'
import kit_3187051 from '@/lib/leer/data/kits/3187051.json'
import bom_3187051 from '@/lib/leer/data/kits/3187051.bom.json'
import kit_3209539 from '@/lib/leer/data/kits/3209539.json'
import bom_3209539 from '@/lib/leer/data/kits/3209539.bom.json'
import kit_3187173 from '@/lib/leer/data/kits/3187173.json'
import bom_3187173 from '@/lib/leer/data/kits/3187173.bom.json'
import kit_3591889 from '@/lib/leer/data/kits/3591889.json'
import bom_3591889 from '@/lib/leer/data/kits/3591889.bom.json'
import kit_3546703 from '@/lib/leer/data/kits/3546703.json'
import bom_3546703 from '@/lib/leer/data/kits/3546703.bom.json'
import kit_3760056 from '@/lib/leer/data/kits/3760056.json'
import bom_3760056 from '@/lib/leer/data/kits/3760056.bom.json'
import kit_5716833 from '@/lib/leer/data/kits/5716833.json'
import bom_5716833 from '@/lib/leer/data/kits/5716833.bom.json'

const LEER_KIT_DATA: Record<string, any> = {
  '10113214': kit_10113214, '3488646': kit_3488646, '3187051': kit_3187051,
  '3209539': kit_3209539,  '3187173': kit_3187173, '3591889': kit_3591889,
  '3546703': kit_3546703,  '3760056': kit_3760056, '5716833': kit_5716833,
}
const LEER_BOM_DATA: Record<string, any> = {
  '10113214': bom_10113214, '3488646': bom_3488646, '3187051': bom_3187051,
  '3209539': bom_3209539,   '3187173': bom_3187173, '3591889': bom_3591889,
  '3546703': bom_3546703,   '3760056': bom_3760056, '5716833': bom_5716833,
}
const LEER_FAMILY_CODE: Record<string, string> = { '100s': '100S', '100rcc': '100RCC' }

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; productId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { category: categorySlug, productId } = await params
  const sp = await searchParams
  const quoteId = sp.quoteId
  const returnUrl = sp.returnUrl ?? (quoteId ? `/dealer/quotes/${quoteId}` : undefined)

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
      ? supabase.from('companies').select('pricing_group_id, catalog_id').eq('id', user.profile.company_id).maybeSingle()
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
  const catalogId = companyRes.data?.catalog_id ?? null

  // Restriction group lives on the catalog, not the company — look it up via catalog_id
  let restrictionGroupId: string | null = null
  if (catalogId && showDealerPricing) {
    const { data: catalog } = await supabase.from('catalogs').select('restriction_group_id').eq('id', catalogId).maybeSingle()
    restrictionGroupId = catalog?.restriction_group_id ?? null
  }
  const productLine = (product as { product_line?: string | null }).product_line ?? undefined
  let pricingTiers: PricingTier[] | null = null

  if (pricingGroupId && showDealerPricing) {
    const { data: schedule } = await supabase.rpc('get_pricing_schedule', {
      p_pricing_group_id: pricingGroupId,
      p_brand: product.brand ?? undefined,
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

  // Catalog restriction check — determines whether this dealer can purchase this product.
  // Restrictions control purchasing eligibility, not visibility. The product is always shown.
  let purchaseAllowed = true
  if (showDealerPricing && restrictionGroupId) {
    const { data: accessResult } = await supabase.rpc('check_product_purchase_access', {
      p_restriction_group_id: restrictionGroupId,
      p_brand: product.brand ?? undefined,
      p_category: categorySlug,
      p_product_line: productLine,
    })
    if (accessResult?.[0]?.access === 'not_allowed') {
      purchaseAllowed = false
    }
  }

  // mapPrice is the base for group-discounted dealer pricing
  const mapPrice = product.map_price

  // LEER configurable cap — build kit data and short-circuit to configurator layout
  const leerKitFamily = (product as any).leer_kit_family as string | undefined
  if (leerKitFamily) {
    const familyCode = LEER_FAMILY_CODE[leerKitFamily]
    const allCatalogKits = (catalogData as any).kits as Array<{ id: string; sku: string; title: string; family: string; fitment: string; historical: boolean }>
    const familyKits = allCatalogKits.filter((k) => k.family === familyCode && !k.historical)
    const kitModels: Record<string, any> = {}
    const kitBoms: Record<string, any> = {}
    for (const kit of familyKits) {
      kitModels[kit.id] = LEER_KIT_DATA[kit.id]
      kitBoms[kit.id] = LEER_BOM_DATA[kit.id]
    }

    const leerSpecs = (product.specifications ?? {}) as Record<string, string>
    const leerWarranty = leerSpecs.warranty

    // Fetch quote vehicle so we can display it and auto-fill Truck Year
    let quoteVehicle: { vehicle_year: number | null; vehicle_make: string | null; vehicle_model: string | null; customer_name: string | null } | null = null
    if (quoteId) {
      const { data } = await supabase.from('quotes').select('vehicle_year, vehicle_make, vehicle_model, customer_name').eq('id', quoteId).maybeSingle()
      quoteVehicle = data
    }
    const vehicleDisplay = quoteVehicle?.vehicle_year && quoteVehicle?.vehicle_make && quoteVehicle?.vehicle_model
      ? `${quoteVehicle.vehicle_year} ${quoteVehicle.vehicle_make} ${quoteVehicle.vehicle_model}`
      : null
    const vehicleYear = quoteVehicle?.vehicle_year ? String(quoteVehicle.vehicle_year) : undefined
    const quoteCustomerName = quoteVehicle?.customer_name ?? null
    const quoteDisplayNumber = quoteId ? `Q-${parseInt(quoteId.split('-').pop() ?? '0', 10).toString().padStart(4, '0')}` : null

    const leerMapPrice = (product as any).map_price as number | null
    const leerDealerPrice = (product as any).dealer_price as number | null
    const leerDiscountRate = pricingTiers?.[0]?.discountPercent
      ? pricingTiers[0].discountPercent / 100
      : leerDealerPrice && leerMapPrice
        ? 1 - leerDealerPrice / leerMapPrice
        : 0.20

    return (
      <div className="flex flex-col gap-6">
        <RecordRecentlyViewed userId={user?.profile.id ?? undefined} productId={product.id} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dealer/shop" className="hover:text-foreground">Shop</Link>
          <span>/</span>
          <Link href={`/dealer/shop/${categorySlug}`} className="hover:text-foreground">{category.name}</Link>
          <span>/</span>
          <span className="font-medium text-foreground">{product.name}</span>
        </div>

        {quoteId && (
          <div className="rounded border border-[#FFC60B]/40 bg-[#FFC60B]/5 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#A04B23]">Configuring for Quote</span>
              <span className="text-sm font-medium text-foreground">
                {quoteDisplayNumber}
                {quoteCustomerName && <span className="text-muted-foreground"> — {quoteCustomerName}</span>}
              </span>
              <span className="text-xs text-muted-foreground">· Selections save directly to this quote.</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left: product info */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {/* Image gallery */}
            <div className="flex gap-3">
              <div className="flex shrink-0 flex-col gap-2">
                <div className="h-[72px] w-[72px] rounded border bg-muted" />
                <div className="h-[72px] w-[72px] rounded border border-dashed bg-muted/50" />
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg border bg-muted" style={{ aspectRatio: '4/3' }}>
                <Package size={64} className="text-muted-foreground/30" />
              </div>
            </div>

            {/* Highlights */}
            {product.highlights.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-semibold">Product Highlights</h2>
                <ul className="flex flex-col gap-2">
                  {product.highlights.map((highlight: string) => (
                    <li key={highlight} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">Description</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>

            {/* Specifications */}
            {Object.keys(leerSpecs).length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-semibold">Specifications</h2>
                <div className="divide-y rounded border">
                  {Object.entries(leerSpecs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-sm capitalize text-muted-foreground">{key}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: identity + fitment + configurator */}
          <div className="w-full shrink-0 lg:w-[500px]">
            {/* Product identity */}
            <div className="mb-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">LEER</p>
              <h1 className="font-brand text-3xl uppercase leading-tight">{product.name}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>

            {/* Starting price block */}
            {(leerDealerPrice || leerMapPrice) && (
              <div className="mb-4 border-t border-b py-3">
                <div className="flex divide-x">
                  {leerDealerPrice && (
                    <div className="pr-5">
                      <p className="text-xs text-muted-foreground">Your Price</p>
                      <p className="text-xl font-bold">Starting at {formatCurrency(leerDealerPrice)}</p>
                    </div>
                  )}
                  {leerMapPrice && (
                    <div className={leerDealerPrice ? 'pl-5' : ''}>
                      <p className="text-xs text-muted-foreground">MAP</p>
                      <p className={`${leerDealerPrice ? 'text-lg font-medium text-muted-foreground' : 'text-xl font-bold'}`}>
                        Starting at {formatCurrency(leerMapPrice)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guaranteed fitment block */}
            <div className="mb-4 flex items-center justify-between rounded border border-muted bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <Check size={15} className="shrink-0 text-green-600" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Guaranteed Fitment</p>
                  <p className="text-sm font-medium text-foreground">
                    {vehicleDisplay ?? familyKits[0]?.fitment ?? 'Select vehicle below'}
                  </p>
                </div>
              </div>
              <button className="shrink-0 text-xs font-medium text-primary hover:underline">
                Change vehicle
              </button>
            </div>

            <div className="rounded border border-[#d5d5d5] bg-white">
              <LeerConfigurator
                kits={familyKits.map((k) => ({ id: k.id, title: k.title, fitment: k.fitment, family: k.family }))}
                kitModels={kitModels}
                kitBoms={kitBoms}
                quoteId={quoteId}
                returnUrl={returnUrl}
                vehicleYear={vehicleYear}
                baseMapPrice={leerMapPrice ?? undefined}
                discountRate={leerDiscountRate}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <RecordRecentlyViewed userId={user?.profile.id ?? undefined} productId={product.id} />
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
          {(() => {
            const images = (product as unknown as { images?: string[] }).images
            const heroSrc = images?.[0]
            return heroSrc ? (
              <div className="overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={heroSrc}
                  alt={product.name}
                  width={1050}
                  height={750}
                  className="w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex aspect-4/3 items-center justify-center rounded-lg border bg-muted">
                <Package size={96} className="text-muted-foreground/40" />
              </div>
            )
          })()}

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

          <div className="mt-10 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Fitment Compatibility</h2>
            <FitmentTable sku={product.sku} />
          </div>

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
              <h1 className="font-brand text-4xl uppercase leading-tight">
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
                <div className="mt-5">
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

              // Restriction notice — shown when the dealer's catalog restrictions block this product.
              // Displayed instead of (not below) the Add to Cart button.
              const restrictionNotice = !purchaseAllowed ? (
                <div className="mt-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                  <Ban size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    This product isn&apos;t available for purchase with your dealer account.
                  </p>
                </div>
              ) : null

              if (!purchaseAllowed) {
                return (
                  <>
                    <div className="border-t py-4">
                      <p className="text-xs text-muted-foreground">MAP</p>
                      <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(mapPrice)}</p>
                    </div>
                    {partAndFitSection}
                    {restrictionNotice}
                  </>
                )
              }

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
                    purchaseAllowed={purchaseAllowed}
                  >
                    {partAndFitSection}
                    {rapidShipSection}
                    {availabilitySection}
                    {restrictionNotice}
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
                    {restrictionNotice ?? (
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
                    )}
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
