'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type Tier = Database['public']['Enums']['installation_tier']
const TIERS: { id: Tier; label: string; description: string }[] = [
  { id: 'tier-1', label: 'Tier 1 - Basic Installation', description: 'Cap only, no electronics, ≤2 accessories' },
  { id: 'tier-2', label: 'Tier 2 - Standard Installation', description: 'Cap + electronics OR cap + 3-5 accessories' },
  { id: 'tier-3', label: 'Tier 3 - Advanced Installation', description: 'Cap + electronics + multiple accessories (>5 items)' },
]

export function LocationPricingOverride({
  location,
  companyDefaults,
  companyName,
}: {
  location: Tables<'locations'>
  companyDefaults: { installation_pricing: Record<string, number>; supported_tiers: Tier[] }
  companyName: string
}) {
  const router = useRouter()
  const [useCustom, setUseCustom] = useState(location.use_custom_pricing)
  const [supported, setSupported] = useState<Tier[]>(
    (location.supported_tiers as Tier[] | null) ?? companyDefaults.supported_tiers ?? []
  )
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const source = (location.installation_pricing as Record<string, number> | null) ?? companyDefaults.installation_pricing ?? {}
    return Object.fromEntries(TIERS.map((t) => [t.id, source[t.id] != null ? String(source[t.id]) : '']))
  })
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const pricingPayload = Object.fromEntries(
        supported.map((tier) => [tier, prices[tier] ? Number(prices[tier]) : 0])
      )
      const { error } = await supabase
        .from('locations')
        .update({
          use_custom_pricing: useCustom,
          installation_pricing: useCustom ? pricingPayload : null,
          supported_tiers: useCustom ? supported : null,
        })
        .eq('id', location.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Installation pricing updated')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked={useCustom} onCheckedChange={(checked) => setUseCustom(checked === true)} />
        Use custom pricing for this location
      </label>

      {!useCustom && (
        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
          <span className="font-medium">Using company pricing.</span> This location inherits installation pricing from{' '}
          {companyName}. Location Admins or Dealer Admins can override these prices by enabling &quot;Use custom pricing&quot; above.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {TIERS.map((tier) => {
          const isSupported = useCustom
            ? supported.includes(tier.id)
            : (companyDefaults.supported_tiers ?? []).includes(tier.id)
          const defaultPrice = companyDefaults.installation_pricing?.[tier.id]
          return (
            <div key={tier.id} className="flex items-center gap-4 rounded-md border p-3">
              <Checkbox
                checked={isSupported}
                disabled={!useCustom}
                onCheckedChange={(checked) =>
                  setSupported((prev) => (checked ? [...prev, tier.id] : prev.filter((t) => t !== tier.id)))
                }
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{tier.label}</p>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
              </div>
              {useCustom ? (
                <Input
                  type="number"
                  className="w-28"
                  value={prices[tier.id] ?? ''}
                  disabled={!supported.includes(tier.id)}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [tier.id]: e.target.value }))}
                />
              ) : (
                <p className="w-28 text-right text-sm text-muted-foreground">
                  {defaultPrice != null ? `${formatCurrency(defaultPrice)} (Company Default)` : '—'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div>
        <Button onClick={handleSave} disabled={isPending} size="sm">
          Save Pricing
        </Button>
      </div>
    </div>
  )
}
