'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// TODO: Replace with the production ACC Order Portal URL
const ACC_PORTAL_URL = 'https://acc.leergroup.com'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

export function ExternalOrderPanel({
  quoteId,
  brand,
  initialOrderNumber,
  orderedAt,
}: {
  quoteId: string
  brand: string
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">{brand}</span>
            <h2 className="font-semibold text-white">ACC Order — Ordered</h2>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3 text-sm">
          <p>
            <span className="text-muted-foreground">ACC Order Number: </span>
            <span className="font-medium">{localOrderNumber}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Ordered: </span>
            <span className="font-medium">{formattedDate}</span>
          </p>
          <a
            href={ACC_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Open ACC Order Portal
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={PANEL}>
      <div className={PANEL_HEADER}>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC60B]">{brand}</span>
          <h2 className="font-semibold text-white">Aluminum Order — ACC Order Portal</h2>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 py-4">
        {/* ACC portal link — prominent, since dealer needs to go there first */}
        <div className="flex items-center justify-between rounded border border-[#e8e8e8] bg-[#f8f8f8] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">ACC Order Portal</p>
            <p className="text-xs text-muted-foreground">
              Place this order in ACC, then come back and enter the order number below.
            </p>
          </div>
          <a
            href={ACC_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 flex shrink-0 items-center gap-1.5 rounded bg-[#1E1E1E] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#333]"
          >
            Open Portal
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Order number entry */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">ACC Order Number</p>
          <div className="flex items-center gap-3">
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. ACC-2026-001234"
              className="max-w-xs"
              disabled={isPending}
            />
            <Button
              onClick={handleMarkAsOrdered}
              disabled={!orderNumber.trim() || isPending}
            >
              Save Order Number
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
