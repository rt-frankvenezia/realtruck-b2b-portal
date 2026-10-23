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
      {/* Scrollable content — overflow:clip so segment headers don't bleed past border-radius */}
      <div className="[overflow:clip]">

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

      {/* Segment rows — full width */}
      <div className="divide-y divide-[#e8e8e8]">
        {visibleSegments.map((seg, idx) => {
          const allowed: string[] = optionsFor(kit, seg, (result as any).constraints.get(seg.key)) ?? []
          const currentCode = (result as any).selections[seg.key] ?? ''
          const currentLabel = seg.labels?.get(currentCode) ?? (currentCode || null)

          return (
            <div key={seg.key}>
              {/* Row header */}
              <div className="flex items-center gap-2.5 bg-[#f5f5f5] px-4 py-2">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                  {seg.label}
                </span>
                {seg.req === 'R' && (
                  <span className="text-xs font-bold text-[#FFC60B]">*</span>
                )}
                <div className="ml-auto flex items-center gap-3">
                  {currentLabel && (
                    <span className="text-xs text-muted-foreground">{currentLabel}</span>
                  )}
                  {currentCode && (
                    <button
                      onClick={() => handleOptionSelect(seg.key, '')}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {/* Options */}
              <div className="flex flex-wrap gap-2 py-3 pl-11 pr-4">
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

      {/* Close overflow:clip wrapper — sticky footer must be outside it */}
      </div>

      {/* Sticky bottom bar — price, progress, save */}
      <div className="sticky bottom-0 border-t border-[#d5d5d5] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.07)]">
        <div className="flex items-center gap-4 px-4 py-4">
          {/* Price + progress */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              List Estimate — Not Dealer Net
            </p>
            <p className="text-2xl font-bold text-[#1E1E1E]">{formatCurrency(est.total)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {visibleSegments.filter((s) => (result as any).selections[s.key]).length} of {visibleSegments.length} answered
              {est.unpriced > 0 && ` · ${est.unpriced} unpriced`}
            </p>
          </div>
          {/* Save / no-quote message */}
          {quoteId ? (
            <button
              onClick={handleSave}
              disabled={!allRequiredFilled || saving || isPending}
              className={[
                'shrink-0 rounded px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors',
                allRequiredFilled && !saving && !isPending
                  ? 'bg-[#FFC60B] text-[#1E1E1E] hover:bg-[#e6b200]'
                  : 'cursor-not-allowed bg-[#D9D9D9] text-[#555555]',
              ].join(' ')}
            >
              {saving || isPending ? 'Saving…' : 'Save to Quote'}
            </button>
          ) : (
            <p className="shrink-0 text-xs text-muted-foreground">
              Open from a quote to save
            </p>
          )}
        </div>
        {quoteId && !allRequiredFilled && (
          <p className="px-4 pb-3 text-xs text-muted-foreground">
            Answer each required (*) question to save.
          </p>
        )}
      </div>
    </div>
  )
}
