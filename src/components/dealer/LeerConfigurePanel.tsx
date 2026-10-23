import Link from 'next/link'
import { CheckCircle2, Settings } from 'lucide-react'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

const LEER_FAMILIES = [
  {
    id: '100s',
    name: 'LEER 100XQ Sport',
    badge: 'Fiberglass',
    description: 'Sport profile, premium gel-coat finish',
  },
  {
    id: '100rcc',
    name: 'LEER 100 RCC',
    badge: 'Fiberglass',
    description: 'Rear corner cap design, flush-mount profile',
  },
  {
    id: 'acc-mt3',
    name: 'LEER ACC-MT3',
    badge: 'Aluminum',
    description: 'All-aluminum construction, economical entry point',
  },
]

type Snapshot = { kit?: string; selections?: Record<string, string> }

function configureUrl(productId: string, quoteId: string) {
  return `/dealer/shop/leer-caps/${productId}?quoteId=${quoteId}&returnUrl=/dealer/quotes/${quoteId}`
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

  // Aluminum: no configurator — manual line items only
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

  // Fiberglass — already configured via snapshot
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

  // Fiberglass — unconfigured, prompt dealer to select product and configure
  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
          <h2 className="font-semibold text-white">Fiberglass Cap — Configuration Required</h2>
        </div>
      </div>
      <div className="px-4 py-4">
        {originalRequestedProduct && (
          <p className="mb-4 text-sm text-muted-foreground">
            Customer requested:{' '}
            <span className="font-medium text-foreground">{originalRequestedProduct}</span>
          </p>
        )}
        <p className="mb-3 text-sm font-medium text-foreground">
          Select a product family to begin configuring:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LEER_FAMILIES.map((family) => (
            <Link
              key={family.id}
              href={configureUrl(family.id, quoteId)}
              className="group flex flex-col gap-1.5 rounded border border-[#d5d5d5] p-4 transition-colors hover:border-[#1E1E1E] hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-tight">{family.name}</span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {family.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{family.description}</p>
              <span className="mt-1 text-xs font-semibold text-primary group-hover:underline">
                Configure →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
