'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PreviewResult = { access: string; source: string } | null

export function RestrictionAccessPreview({ restrictionGroupId }: { restrictionGroupId: string }) {
  const [isPending, startTransition] = useTransition()
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [productLine, setProductLine] = useState('')
  const [result, setResult] = useState<PreviewResult>(null)

  function handleCheck() {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('check_product_purchase_access', {
        p_restriction_group_id: restrictionGroupId,
        p_brand: brand.trim() || undefined,
        p_category: category.trim() || undefined,
        p_product_line: productLine.trim() || undefined,
      })
      if (error) {
        setResult(null)
        return
      }
      setResult(data?.[0] ?? null)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Enter any combination of product attributes to see the effective purchasing result for this group.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Brand</Label>
          <Input
            placeholder="e.g. Retrax"
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setResult(null) }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Category slug</Label>
          <Input
            placeholder="e.g. truck-bed-covers"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setResult(null) }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Product Line slug</Label>
          <Input
            placeholder="e.g. retraxpro-xr"
            value={productLine}
            onChange={(e) => { setProductLine(e.target.value); setResult(null) }}
          />
        </div>
      </div>
      <div>
        <Button size="sm" onClick={handleCheck} disabled={isPending || (!brand && !category && !productLine)}>
          Check Access
        </Button>
      </div>

      {result && (
        <div className={`flex items-start gap-3 rounded-md border p-4 ${result.access === 'allowed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {result.access === 'allowed' ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
          ) : (
            <XCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
          )}
          <div>
            <p className={`font-semibold ${result.access === 'allowed' ? 'text-green-700' : 'text-destructive'}`}>
              {result.access === 'allowed' ? 'Allowed' : 'Not Allowed'}
            </p>
            <p className="text-sm text-muted-foreground">Reason: {result.source}</p>
          </div>
        </div>
      )}
    </div>
  )
}
