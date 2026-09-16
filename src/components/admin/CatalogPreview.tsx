'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/status-labels'

type ScheduleRow = { min_quantity: number; discount_percent: number; source: string }

type PreviewResult = {
  availability: { access: 'allowed' | 'not_allowed'; source: string } | null
  schedule: ScheduleRow[] | null
}

export function CatalogPreview({
  pricingGroupId,
  restrictionGroupId,
}: {
  pricingGroupId: string
  restrictionGroupId: string
}) {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [productLine, setProductLine] = useState('')
  const [mapPrice, setMapPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCalculate() {
    startTransition(async () => {
      const supabase = createClient()

      const [availRes, schedRes] = await Promise.all([
        supabase.rpc('check_product_purchase_access', {
          p_restriction_group_id: restrictionGroupId,
          p_brand: brand || undefined,
          p_category: category || undefined,
          p_product_line: productLine || undefined,
        }),
        supabase.rpc('get_pricing_schedule', {
          p_pricing_group_id: pricingGroupId,
          p_brand: brand || undefined,
          p_category: category || undefined,
          p_product_line: productLine || undefined,
        }),
      ])

      if (availRes.error) { toast.error(availRes.error.message); return }
      if (schedRes.error) { toast.error(schedRes.error.message); return }

      setResult({
        availability: availRes.data?.[0]
          ? { access: availRes.data[0].access as 'allowed' | 'not_allowed', source: availRes.data[0].source }
          : null,
        schedule: schedRes.data?.length
          ? schedRes.data.map((r) => ({
              min_quantity: r.min_quantity,
              discount_percent: Number(r.discount_percent),
              source: r.source,
            }))
          : null,
      })
    })
  }

  const map = Number(mapPrice) || 0
  const qty = Math.max(1, parseInt(quantity) || 1)

  const winningTier = result?.schedule
    ? [...result.schedule]
        .filter((r) => r.min_quantity <= qty)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0] ?? result.schedule[0]
    : null

  const dealerPrice = winningTier && map > 0 ? map * (1 - winningTier.discount_percent / 100) : null
  const purchasable = result?.availability?.access === 'allowed'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Enter product attributes and a quantity to preview the effective availability and pricing under this catalog.
        Specificity: Product Line → Brand → Category → Default.
      </p>

      <div className="grid grid-cols-5 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>Brand</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. BAK" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. truck-bed-covers" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Product Line</Label>
          <Input value={productLine} onChange={(e) => setProductLine(e.target.value)} placeholder="e.g. bakflip-mx4" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>MAP Price</Label>
          <Input type="number" step="0.01" value={mapPrice} onChange={(e) => setMapPrice(e.target.value)} placeholder="1599.00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Quantity</Label>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
        </div>
      </div>

      <div>
        <Button size="sm" onClick={handleCalculate} disabled={isPending}>
          Preview
        </Button>
      </div>

      {result && (
        <div className="flex flex-col gap-4">
          {/* Availability result */}
          <div className="rounded-md border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Availability</p>
            {result.availability ? (
              <div className="flex items-start gap-3">
                {purchasable ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                ) : (
                  <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                )}
                <div>
                  <Badge variant={purchasable ? 'success' : 'destructive'}>
                    {purchasable ? 'Allowed' : 'Not Allowed'}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">Rule source: {result.availability.source}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No result returned.</p>
            )}
          </div>

          {/* Pricing result */}
          <div className="rounded-md border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing</p>
            {winningTier ? (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">MAP Price</p>
                  <p className="text-lg font-semibold">{map > 0 ? formatCurrency(map) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-semibold">{winningTier.source}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Discount at qty {qty}</p>
                  <p className="text-lg font-semibold">{winningTier.discount_percent}%</p>
                  <p className="text-xs text-muted-foreground">{winningTier.min_quantity}+ tier</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dealer Price</p>
                  <p className="text-lg font-semibold">{dealerPrice !== null ? formatCurrency(dealerPrice) : '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pricing result returned.</p>
            )}
          </div>

          {/* Final verdict */}
          {result.availability && winningTier && (
            <div className={`rounded-md border px-4 py-3 ${purchasable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm font-semibold ${purchasable ? 'text-green-800' : 'text-red-800'}`}>
                {purchasable
                  ? `Purchasable at ${map > 0 && dealerPrice !== null ? formatCurrency(dealerPrice) : winningTier.discount_percent + '% off MAP'}`
                  : `Not purchasable — ${result.availability.source}`}
              </p>
              {purchasable && (
                <p className="text-xs text-green-700 mt-0.5">
                  Pricing source: {winningTier.source} · {winningTier.discount_percent}% off at qty {winningTier.min_quantity}+
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
