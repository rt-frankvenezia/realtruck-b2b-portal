'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/status-labels'

export function PricingCalculatorPreview({ pricingGroupId }: { pricingGroupId: string }) {
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [productLine, setProductLine] = useState('')
  const [mapPrice, setMapPrice] = useState('')
  const [result, setResult] = useState<{ discountPercent: number; source: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCalculate() {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('calculate_pricing_discount', {
        p_pricing_group_id: pricingGroupId,
        p_brand: brand || undefined,
        p_category: category || undefined,
        p_product_line: productLine || undefined,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      const row = data?.[0]
      if (!row) {
        toast.error('No result — this group may not be visible to you')
        setResult(null)
        return
      }
      setResult({ discountPercent: Number(row.discount_percent), source: row.source })
    })
  }

  const map = Number(mapPrice) || 0
  const dealerPrice = result ? map * (1 - result.discountPercent / 100) : null

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Enter a brand, category, and/or product line to preview which rule applies (Product Line beats Category beats Brand beats
        the base discount).
      </p>
      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col gap-2">
          <Label>Brand</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. are" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. truck-caps" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Product Line</Label>
          <Input value={productLine} onChange={(e) => setProductLine(e.target.value)} placeholder="e.g. z-series" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>MAP Price</Label>
          <Input type="number" step="0.01" value={mapPrice} onChange={(e) => setMapPrice(e.target.value)} placeholder="1999.00" />
        </div>
      </div>
      <div>
        <Button size="sm" onClick={handleCalculate} disabled={isPending}>
          Calculate
        </Button>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-4 rounded-md border p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">MAP Price</p>
            <p className="text-lg font-semibold">{formatCurrency(map)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Discount</p>
            <p className="text-lg font-semibold">{result.discountPercent}%</p>
            <p className="text-xs text-muted-foreground">{result.source}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Dealer Price</p>
            <p className="text-lg font-semibold">{formatCurrency(dealerPrice)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
