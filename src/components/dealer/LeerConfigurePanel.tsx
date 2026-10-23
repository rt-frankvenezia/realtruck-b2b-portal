'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Settings, Star } from 'lucide-react'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

// Maps a cap name / family hint to the configurator productId route segment
function toProductId(name: string): '100s' | '100rcc' | 'acc-mt3' {
  const u = name.toUpperCase()
  if (u.includes('RCC')) return '100rcc'
  if (u.includes('ACC') || u.includes('ALUMINUM')) return 'acc-mt3'
  return '100s'
}

function configureUrl(productId: string, quoteId: string) {
  return `/dealer/shop/leer-caps/${productId}?quoteId=${quoteId}&returnUrl=/dealer/quotes/${quoteId}`
}

type Brand = 'LEER' | 'Century' | 'Snugtop'
type Snapshot = { kit?: string; selections?: Record<string, string> }

type CapEntry = { name: string; productId: '100s' | '100rcc' | 'acc-mt3' | null }

const BRAND_CAPS: Record<Brand, CapEntry[]> = {
  LEER: [
    { name: 'LEER 100XQ Sport',   productId: '100s' },
    { name: 'LEER 100R',          productId: '100s' },
    { name: 'LEER 100RCC',        productId: '100rcc' },
    { name: 'LEER 100L',          productId: '100s' },
    { name: 'LEER 100XR',         productId: '100s' },
    { name: 'LEER 100RL',         productId: '100s' },
    { name: 'LEER 180',           productId: '100s' },
    { name: 'LEER 122',           productId: '100s' },
    { name: 'LEER 228',           productId: '100s' },
    { name: 'LEER 350MR',         productId: '100s' },
    { name: 'LEER Premier',       productId: '100s' },
  ],
  Century: [
    { name: 'Century 100XQ',  productId: null },
    { name: 'Century 100R',   productId: null },
    { name: 'Century 100RCC', productId: null },
    { name: 'Century 100L',   productId: null },
    { name: 'Century 100XR',  productId: null },
    { name: 'Century 100RL',  productId: null },
    { name: 'Century 180',    productId: null },
    { name: 'Century 122',    productId: null },
    { name: 'Century 228',    productId: null },
    { name: 'Century 350MR',  productId: null },
  ],
  Snugtop: [
    { name: 'Snugtop Rebel',       productId: null },
    { name: 'Snugtop Super Sport',  productId: null },
    { name: 'Snugtop Rebel XL',    productId: null },
    { name: 'Snugtop WorkTop',     productId: null },
    { name: 'Snugtop Sportsman',   productId: null },
    { name: 'Snugtop Construck',   productId: null },
    { name: 'Snugtop Ridgeline',   productId: null },
  ],
}

const BRANDS: Brand[] = ['LEER', 'Century', 'Snugtop']

function guessBrand(product: string): Brand {
  const u = product.toUpperCase()
  if (u.includes('CENTURY')) return 'Century'
  if (u.includes('SNUGTOP')) return 'Snugtop'
  return 'LEER'
}

export function LeerConfigurePanel({
  quoteId,
  configurationMethod,
  originalRequestedProduct,
  configurationSnapshot,
  hasLineItems,
}: {
  quoteId: string
  configurationMethod: string | null
  originalRequestedProduct: string | null
  configurationSnapshot: Snapshot | null
  hasLineItems: boolean
}) {
  const isAluminum = configurationMethod === 'leer-aluminum'
  const isConfigured = Boolean(configurationSnapshot?.kit)
  const selectionCount = Object.keys(configurationSnapshot?.selections ?? {}).length
  const familyId = configurationSnapshot?.kit
    ? configurationSnapshot.kit.split('-')[0].toLowerCase()
    : '100s'

  const defaultBrand: Brand = originalRequestedProduct ? guessBrand(originalRequestedProduct) : 'LEER'
  const [activeBrand, setActiveBrand] = useState<Brand>(defaultBrand)

  // Aluminum: no configurator
  if (isAluminum) {
    return (
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
            <h2 className="font-semibold text-white">
              {originalRequestedProduct ?? 'LEER Aluminum Tonneau Cap'}
            </h2>
            <span className="ml-1 rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">Aluminum</span>
          </div>
        </div>
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Aluminum tonneau caps are priced manually. Use the line items editor below to add the cap and any accessories.
        </div>
      </div>
    )
  }

  // Fiberglass — already configured
  if (isConfigured) {
    return (
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
            <h2 className="font-semibold text-white">
              {originalRequestedProduct ?? 'LEER Fiberglass Cap'}
            </h2>
            <CheckCircle2 size={14} className="ml-1 text-green-400" />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Kit: <span className="font-mono text-foreground">{configurationSnapshot?.kit}</span>
            <span className="mx-3 text-muted-foreground/40">•</span>
            {selectionCount} option{selectionCount !== 1 ? 's' : ''} selected
            {hasLineItems && (
              <>
                <span className="mx-3 text-muted-foreground/40">•</span>
                Line items populated
              </>
            )}
          </p>
          <Link
            href={configureUrl(familyId, quoteId)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Settings size={14} />
            Reconfigure
          </Link>
        </div>
      </div>
    )
  }

  // Unconfigured fiberglass — show picker
  const requestedProductId = originalRequestedProduct ? toProductId(originalRequestedProduct) : null
  const caps = BRAND_CAPS[activeBrand]

  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
          <h2 className="font-semibold text-white">Fiberglass Cap — Select &amp; Configure</h2>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Customer-requested cap — featured */}
        {originalRequestedProduct && requestedProductId && (
          <div className="rounded border border-[#FFC60B]/40 bg-[#FFC60B]/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <Star size={14} className="mt-0.5 shrink-0 text-[#FFC60B]" fill="currentColor" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC60B]">Customer Requested</p>
                  <p className="mt-0.5 text-sm font-semibold">{originalRequestedProduct}</p>
                </div>
              </div>
              <Link
                href={configureUrl(requestedProductId, quoteId)}
                className="shrink-0 rounded bg-[#1E1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Configure →
              </Link>
            </div>
          </div>
        )}

        {/* Brand tabs + cap list */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {originalRequestedProduct ? 'Or configure a different cap:' : 'Select a cap to configure:'}
          </p>

          {/* Brand tabs */}
          <div className="flex gap-1 border-b border-[#d5d5d5]">
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  activeBrand === brand
                    ? 'border-b-2 border-[#FFC60B] text-[#1E1E1E] -mb-px'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {brand}
                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground/60">
                  ({BRAND_CAPS[brand].length})
                </span>
              </button>
            ))}
          </div>

          {/* Cap grid */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {caps.map((cap) => (
              cap.productId ? (
                <Link
                  key={cap.name}
                  href={configureUrl(cap.productId, quoteId)}
                  className="group flex items-center justify-between rounded border border-[#d5d5d5] px-3 py-2 text-sm hover:border-[#1E1E1E] hover:bg-muted/10"
                >
                  <span className="font-medium leading-tight">{cap.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground group-hover:text-primary">→</span>
                </Link>
              ) : (
                <div
                  key={cap.name}
                  className="flex items-center justify-between rounded border border-dashed border-[#d5d5d5] px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{cap.name}</span>
                  <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Soon</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
