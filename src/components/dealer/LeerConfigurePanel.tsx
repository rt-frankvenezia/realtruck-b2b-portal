'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Settings, Star } from 'lucide-react'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

// Catalog product IDs for configurable LEER fiberglass cap families
const LEER_PRODUCT_IDS: Record<string, string> = {
  '100s':   'b1111111-0000-0000-0000-000000000016',
  '100rcc': 'b1111111-0000-0000-0000-000000000017',
}

// Map from kit ID (numeric string) → kit family slug
const KIT_FAMILY: Record<string, string> = {
  '10113214': '100s',
  '3488646':  '100rcc',
  '3187051':  '100rcc',
  '3209539':  '100rcc',
  '3187173':  '100rcc',
}

// Maps a cap name to the kit family slug
function toKitFamily(name: string): '100s' | '100rcc' | null {
  const u = name.toUpperCase()
  if (u.includes('RCC')) return '100rcc'
  if (u.includes('ACC') || u.includes('ALUMINUM')) return null
  return '100s'
}

function configureUrl(kitFamily: string, quoteId: string): string {
  const productId = LEER_PRODUCT_IDS[kitFamily]
  if (!productId) return '#'
  return `/dealer/shop/leer-fiberglass-caps/${productId}?quoteId=${quoteId}&returnUrl=/dealer/quotes/${quoteId}`
}

type Brand = 'LEER' | 'Century' | 'Snugtop'
type Snapshot = { kit?: string; selections?: Record<string, string> }

type CapEntry = { name: string; kitFamily: '100s' | '100rcc' | null }

const BRAND_CAPS: Record<Brand, CapEntry[]> = {
  LEER: [
    { name: 'LEER 100XQ Sport',   kitFamily: '100s' },
    { name: 'LEER 100R',          kitFamily: '100s' },
    { name: 'LEER 100RCC',        kitFamily: '100rcc' },
    { name: 'LEER 100L',          kitFamily: '100s' },
    { name: 'LEER 100XR',         kitFamily: '100s' },
    { name: 'LEER 100RL',         kitFamily: '100s' },
    { name: 'LEER 180',           kitFamily: '100s' },
    { name: 'LEER 122',           kitFamily: '100s' },
    { name: 'LEER 228',           kitFamily: '100s' },
    { name: 'LEER 350MR',         kitFamily: '100s' },
    { name: 'LEER Premier',       kitFamily: '100s' },
  ],
  Century: [
    { name: 'Century 100XQ',  kitFamily: null },
    { name: 'Century 100R',   kitFamily: null },
    { name: 'Century 100RCC', kitFamily: null },
    { name: 'Century 100L',   kitFamily: null },
    { name: 'Century 100XR',  kitFamily: null },
    { name: 'Century 100RL',  kitFamily: null },
    { name: 'Century 180',    kitFamily: null },
    { name: 'Century 122',    kitFamily: null },
    { name: 'Century 228',    kitFamily: null },
    { name: 'Century 350MR',  kitFamily: null },
  ],
  Snugtop: [
    { name: 'Snugtop Rebel',       kitFamily: null },
    { name: 'Snugtop Super Sport',  kitFamily: null },
    { name: 'Snugtop Rebel XL',    kitFamily: null },
    { name: 'Snugtop WorkTop',     kitFamily: null },
    { name: 'Snugtop Sportsman',   kitFamily: null },
    { name: 'Snugtop Construck',   kitFamily: null },
    { name: 'Snugtop Ridgeline',   kitFamily: null },
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
    ? (KIT_FAMILY[configurationSnapshot.kit] ?? '100s')
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
  const requestedKitFamily = originalRequestedProduct ? toKitFamily(originalRequestedProduct) : null
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
        {originalRequestedProduct && requestedKitFamily && (
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
                href={configureUrl(requestedKitFamily, quoteId)}
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
              cap.kitFamily ? (
                <Link
                  key={cap.name}
                  href={configureUrl(cap.kitFamily, quoteId)}
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
