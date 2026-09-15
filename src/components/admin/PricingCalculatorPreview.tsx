'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/status-labels'

type ScheduleRow = { min_quantity: number; discount_percent: number; source: string }

export function PricingCalculatorPreview({ pricingGroupId }: { pricingGroupId: string }) {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [productLine, setProductLine] = useState('')
  const [mapPrice, setMapPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [schedule, setSchedule] = useState<ScheduleRow[] | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCalculate() {
    startTransition(async () => {
      const supabase = createClient()

      // Fetch the full schedule so we can display the tier table
      const { data: schedData, error: schedError } = await supabase.rpc('get_pricing_schedule', {
        p_pricing_group_id: pricingGroupId,
        p_brand: brand || undefined,
        p_category: category || undefined,
        p_product_line: productLine || undefined,
      })
      if (schedError) {
        toast.error(schedError.message)
        return
      }
      if (!schedData || schedData.length === 0) {
        toast.error('No result — this group may not be visible to you')
        setSchedule(null)
        return
      }
      setSchedule(
        schedData.map((r) => ({
          min_quantity: r.min_quantity,
          discount_percent: Number(r.discount_percent),
          source: r.source,
        })),
      )
    })
  }

  const map = Number(mapPrice) || 0
  const qty = Math.max(1, parseInt(quantity) || 1)

  // Find the winning tier for the given quantity
  const winningTier = schedule
    ? [...schedule]
        .filter((r) => r.min_quantity <= qty)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0] ?? schedule[0]
    : null

  const dealerPrice = winningTier ? map * (1 - winningTier.discount_percent / 100) : null

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Enter product attributes and a quantity to preview which rule and tier apply.
        Specificity: Product Line beats Category beats Brand beats the base discount.
        Quantity tiers are evaluated only within the winning source.
      </p>
      <div className="grid grid-cols-5 gap-2">
        <div className="flex flex-col gap-2">
          <Label>Brand</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Retrax" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. truck-bed-covers" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Product Line</Label>
          <Input value={productLine} onChange={(e) => setProductLine(e.target.value)} placeholder="e.g. retraxpro-xr" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>MAP Price</Label>
          <Input type="number" step="0.01" value={mapPrice} onChange={(e) => setMapPrice(e.target.value)} placeholder="1599.00" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
          />
        </div>
      </div>
      <div>
        <Button size="sm" onClick={handleCalculate} disabled={isPending}>
          Calculate
        </Button>
      </div>

      {schedule && winningTier && (
        <div className="flex flex-col gap-4">
          {/* Result summary */}
          <div className="grid grid-cols-4 gap-4 rounded-md border p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">MAP Price</p>
              <p className="text-lg font-semibold">{map > 0 ? formatCurrency(map) : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Source</p>
              <p className="text-sm font-semibold">{winningTier.source}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Discount at qty {qty}</p>
              <p className="text-lg font-semibold">{winningTier.discount_percent}%</p>
              <p className="text-xs text-muted-foreground">{winningTier.min_quantity}+ tier</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Dealer Price</p>
              <p className="text-lg font-semibold">{map > 0 ? formatCurrency(dealerPrice) : '—'}</p>
            </div>
          </div>

          {/* Full tier schedule */}
          {schedule.length > 1 && (
            <div className="rounded-md border">
              <div className="border-b px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tier Schedule — {schedule[0].source}
                </p>
              </div>
              <div className="divide-y">
                {schedule.map((row) => {
                  const isActive = row.min_quantity === winningTier.min_quantity
                  const tierDealerPrice = map > 0 ? map * (1 - row.discount_percent / 100) : null
                  return (
                    <div
                      key={row.min_quantity}
                      className={`flex items-center justify-between px-3 py-2 text-sm ${
                        isActive ? 'bg-primary/5 font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      <span>
                        {row.min_quantity}+{isActive && <span className="ml-2 text-xs text-primary">← qty {qty}</span>}
                      </span>
                      <div className="flex items-center gap-6">
                        <span>{row.discount_percent}%</span>
                        {map > 0 && <span>{formatCurrency(tierDealerPrice)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
