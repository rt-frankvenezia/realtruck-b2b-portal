'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function firstOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function GenerateStatementForm({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [periodStart, setPeriodStart] = useState(firstOfMonth())
  const [periodEnd, setPeriodEnd] = useState(today())
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('generate_statement', {
        p_company_id: companyId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Statement generated')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="period-start" className="text-xs font-semibold uppercase text-muted-foreground">
          Period Start
        </Label>
        <Input id="period-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="period-end" className="text-xs font-semibold uppercase text-muted-foreground">
          Period End
        </Label>
        <Input id="period-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
      </div>
      <Button onClick={handleGenerate} disabled={isPending}>
        Generate Statement
      </Button>
    </div>
  )
}
