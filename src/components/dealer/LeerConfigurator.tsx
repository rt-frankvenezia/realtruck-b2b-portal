'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  compileKit,
  defaultSelections,
  evaluate,
  baseEstimate,
  optionBase,
  optionsFor,
} from '@/lib/leer/engine.js'

// ─── Types ───────────────────────────────────────────────────────────────────

type KitSummary = {
  id: string
  title: string
  fitment: string
  family: string
}

type Props = {
  kits: KitSummary[]
  kitModels: Record<string, any>
  kitBoms: Record<string, any>
  quoteId?: string
  returnUrl?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function buildLineItems(
  kit: any,
  bom: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  est: any,
  kitModel: any,
  quoteId: string,
): any[] {
  const items: any[] = []

  // Base item
  items.push({
    quote_id: quoteId,
    description: kitModel.title ?? kit.model?.title ?? '',
    sku: kitModel.sku ?? '',
    price: est.total ?? 0,
    msrp: est.total ?? 0,
    quantity: 1,
    is_required: true,
    type: 'base',
  })

  // Option line items for each visible segment with a priced selection
  const levelSeq = new Map<string, number>(
    (kit.model?.levels ?? []).map((l: any) => [l.kit, l.seq]),
  )
  const visibleSegments: any[] = (kit.segments ?? [])
    .filter((s: any) => !s.calculated)
    .sort((a: any, b: any) => {
      const la = levelSeq.get(a.kit) ?? 0
      const lb = levelSeq.get(b.kit) ?? 0
      if (la !== lb) return la - lb
      return (a.pel ?? 0) - (b.pel ?? 0)
    })

  const constraints = (result as any).constraints
  const sel = (result as any).selections
  for (const seg of visibleSegments) {
    const allowed = optionsFor(kit, seg, constraints.get(seg.key))
    if (!allowed || allowed.length === 0) continue
    const code = sel[seg.key] ?? ''
    if (!code) continue
    const price = optionBase(kit, bom, sel, seg.key, code)
    if (typeof price === 'number' && price > 0) {
      const label = seg.labels?.get(code) ?? code
      items.push({
        quote_id: quoteId,
        description: `${seg.label}: ${label}`,
        sku: null,
        price,
        msrp: price,
        quantity: 1,
        is_required: false,
        type: 'option',
      })
    }
  }

  return items
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LeerConfigurator({
  kits,
  kitModels,
  kitBoms,
  quoteId,
  returnUrl,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [kitId, setKitId] = useState<string>(kits[0]?.id ?? '')
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const rawKit = kitModels[kits[0]?.id ?? '']
    if (!rawKit) return {}
    const compiled = compileKit(rawKit)
    return defaultSelections(compiled)
  })
  const [saving, setSaving] = useState(false)

  // Compile current kit on the fly (client-side) — never serialized as props
  const kit = useMemo(() => {
    const rawKit = kitModels[kitId]
    if (!rawKit) return null
    return compileKit(rawKit)
  }, [kitId, kitModels])

  const bom = useMemo(() => kitBoms[kitId] ?? null, [kitId, kitBoms])

  const result = useMemo((): any => {
    if (!kit) return null
    return evaluate(kit, selections) as any
  }, [kit, selections])

  const est = useMemo((): any => {
    if (!kit || !bom || !result) return null
    return baseEstimate(kit, bom, (result as any).selections) as any
  }, [kit, bom, result])

  // Build sorted visible segments
  const visibleSegments = useMemo(() => {
    if (!kit || !result) return []
    const constraints = (result as any).constraints
    const levelSeq = new Map<string, number>(
      (kit.model?.levels ?? []).map((l: any) => [l.kit, l.seq]),
    )
    return (kit.segments ?? [])
      .filter((s: any) => !s.calculated)
      .sort((a: any, b: any) => {
        const la = levelSeq.get(a.kit) ?? 0
        const lb = levelSeq.get(b.kit) ?? 0
        if (la !== lb) return la - lb
        return (a.pel ?? 0) - (b.pel ?? 0)
      })
      .filter((s: any) => {
        const allowed = optionsFor(kit, s, constraints.get(s.key))
        return allowed && allowed.length > 0
      })
  }, [kit, result])

  // Determine if all required segments are filled
  const allRequiredFilled = useMemo(() => {
    if (!kit || !result) return false
    const sel = (result as any).selections
    return visibleSegments
      .filter((s: any) => s.req === 'R')
      .every((s: any) => {
        const code = sel[s.key]
        return code && code !== ''
      })
  }, [kit, result, visibleSegments])

  function handleKitChange(newKitId: string) {
    const rawKit = kitModels[newKitId]
    if (!rawKit) return
    const compiled = compileKit(rawKit)
    setKitId(newKitId)
    setSelections(defaultSelections(compiled))
  }

  function handleOptionSelect(segKey: string, code: string) {
    setSelections((prev) => ({ ...prev, [segKey]: code }))
  }

  async function handleSave() {
    if (!quoteId || !kit || !bom || !result || !est) return
    setSaving(true)
    try {
      const snapshot = { kit: kitId, selections: (result as any).selections }
      const lineItems = buildLineItems(kit, bom, result, est, kitModels[kitId], quoteId)

      const supabase = createClient()
      await supabase
        .from('quotes')
        .update({ configuration_snapshot: snapshot })
        .eq('id', quoteId)
      await supabase.from('quote_line_items').delete().eq('quote_id', quoteId)
      await supabase.from('quote_line_items').insert(lineItems)

      startTransition(() => {
        router.push(returnUrl ?? `/dealer/quotes/${quoteId}`)
      })
    } catch (err) {
      console.error('Save failed:', err)
      setSaving(false)
    }
  }

  if (!kit || !result || !est) {
    return (
      <div className="px-6 py-4 text-sm text-muted-foreground">
        Loading configurator…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Kit picker */}
      {kits.length > 1 && (
        <div className="border-b px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Fitment
          </p>
          <div className="flex flex-wrap gap-2">
            {kits.map((k) => (
              <button
                key={k.id}
                onClick={() => handleKitChange(k.id)}
                className={[
                  'rounded border px-3 py-1.5 text-sm font-medium transition-colors',
                  kitId === k.id
                    ? 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                    : 'border-[#d5d5d5] bg-white text-foreground hover:border-[#1E1E1E] hover:bg-muted/20',
                ].join(' ')}
              >
                {k.fitment}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main configurator + price panel */}
      <div className="flex flex-col gap-0 lg:flex-row">
        {/* Segment cards */}
        <div className="flex-1 divide-y divide-[#d5d5d5]">
          {visibleSegments.map((seg) => {
            const allowed: string[] = optionsFor(kit, seg, (result as any).constraints.get(seg.key)) ?? []
            const currentCode = (result as any).selections[seg.key] ?? ''

            return (
              <div key={seg.key} className="px-6 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{seg.label}</span>
                  {seg.req === 'R' && (
                    <span className="rounded bg-[#1E1E1E] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allowed.map((code) => {
                    const label = seg.labels?.get(code) ?? code
                    const price = optionBase(kit, bom, (result as any).selections, seg.key, code)
                    const isSelected = currentCode === code

                    return (
                      <button
                        key={code}
                        onClick={() => handleOptionSelect(seg.key, code)}
                        className={[
                          'flex flex-col items-start rounded border px-3 py-2 text-left text-sm transition-colors',
                          isSelected
                            ? 'border-[#FFC60B] bg-[#FFC60B]/10 ring-1 ring-[#FFC60B]'
                            : 'border-[#d5d5d5] bg-white hover:border-[#1E1E1E] hover:bg-muted/10',
                        ].join(' ')}
                      >
                        <span className={isSelected ? 'font-semibold text-[#1E1E1E]' : 'text-foreground'}>
                          {label}
                        </span>
                        {typeof price === 'number' && price > 0 && (
                          <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                            +{formatCurrency(price)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {visibleSegments.length === 0 && (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              No configurable options available for this fitment.
            </div>
          )}
        </div>

        {/* Price + save panel */}
        <div className="w-full shrink-0 border-t lg:w-[280px] lg:border-l lg:border-t-0">
          <div className="sticky top-4 flex flex-col gap-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Price
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1E1E1E]">
                {formatCurrency(est.total)}
              </p>
              {est.unpriced > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  (includes {est.unpriced} unpriced item{est.unpriced !== 1 ? 's' : ''})
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kit
              </p>
              <p className="text-sm font-medium text-foreground">{kitModels[kitId]?.title ?? kitId}</p>
              <p className="text-xs text-muted-foreground">{kits.find((k) => k.id === kitId)?.fitment}</p>
            </div>

            {quoteId ? (
              <button
                onClick={handleSave}
                disabled={!allRequiredFilled || saving || isPending}
                className={[
                  'w-full rounded px-4 py-2.5 text-sm font-semibold transition-colors',
                  allRequiredFilled && !saving && !isPending
                    ? 'bg-[#FFC60B] text-[#1E1E1E] hover:bg-[#e6b200]'
                    : 'cursor-not-allowed bg-[#D9D9D9] text-[#555555]',
                ].join(' ')}
              >
                {saving || isPending ? 'Saving…' : 'Save to Quote'}
              </button>
            ) : (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Open this configurator from a quote to save selections.
              </div>
            )}

            {quoteId && !allRequiredFilled && (
              <p className="text-xs text-muted-foreground">
                Complete all required fields to save.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
