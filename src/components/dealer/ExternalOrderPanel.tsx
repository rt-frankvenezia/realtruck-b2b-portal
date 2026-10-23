'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

export function ExternalOrderPanel({
  quoteId,
  initialOrderNumber,
  orderedAt,
}: {
  quoteId: string
  initialOrderNumber: string | null
  orderedAt: string | null
}) {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? '')
  const [isPending, startTransition] = useTransition()
  const [localOrderedAt, setLocalOrderedAt] = useState<string | null>(orderedAt)
  const [localOrderNumber, setLocalOrderNumber] = useState<string | null>(initialOrderNumber)

  const isOrdered = localOrderedAt !== null

  function handleMarkAsOrdered() {
    if (!orderNumber.trim()) return
    startTransition(async () => {
      const supabase = createClient()
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('quotes')
        .update({
          external_order_number: orderNumber.trim(),
          ordered_externally_at: now,
        })
        .eq('id', quoteId)

      if (error) {
        toast.error('Failed to save order number.')
        return
      }

      setLocalOrderNumber(orderNumber.trim())
      setLocalOrderedAt(now)
      toast.success('Order recorded.')
      router.refresh()
    })
  }

  if (isOrdered) {
    const formattedDate = new Date(localOrderedAt!).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    return (
      <div className={PANEL}>
        <div className={PANEL_HEADER}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
            <h2 className="font-semibold text-white">External Order — Ordered</h2>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3 text-sm">
          <p>
            <span className="text-muted-foreground">Order Number: </span>
            <span className="font-medium">{localOrderNumber}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Ordered: </span>
            <span className="font-medium">{formattedDate}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">LEER</span>
          <h2 className="font-semibold text-white">External Order — LEER Dealer Portal</h2>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Place this order through the LEER dealer portal, then enter the LEER order number below.
        </p>
        <div className="flex items-center gap-3">
          <label className="shrink-0 text-sm font-medium text-foreground">LEER Order #:</label>
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. LEER-2026-001234"
            className="max-w-xs"
            disabled={isPending}
          />
          <Button
            onClick={handleMarkAsOrdered}
            disabled={!orderNumber.trim() || isPending}
          >
            Mark as Ordered
          </Button>
        </div>
      </div>
    </div>
  )
}
