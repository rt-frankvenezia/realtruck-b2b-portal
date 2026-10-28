'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  actionStartWorking,
  actionSendQuote,
  actionMarkAsSent,
  actionMarkCustomerApproved,
  actionReviseQuote,
  actionCloseAsLost,
  actionDismiss,
  actionReopenQuote,
} from '@/lib/actions/quotes'

const LOST_REASONS = ['Price', 'Purchased Elsewhere', 'No Longer Needed', 'Unable to Contact', 'Other']
const DISMISS_REASONS = ['Spam', 'Invalid', 'Test']

type Dialog =
  | { type: 'send' }
  | { type: 'approve' }
  | { type: 'lost' }
  | { type: 'dismiss' }
  | null

export function QuoteActionBar({
  quoteId,
  status,
  partsStatus,
  orderNumber,
  displayNum,
  customerName,
  onOrderParts,
}: {
  quoteId: string
  status: string
  partsStatus: string
  orderNumber?: string | null
  displayNum: string
  customerName: string | null
  onOrderParts: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<Dialog>(null)

  // Dialog field state
  const [sendMsg, setSendMsg] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [lostReason, setLostReason] = useState(LOST_REASONS[0])
  const [lostNote, setLostNote] = useState('')
  const [dismissReason, setDismissReason] = useState(DISMISS_REASONS[0])

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      setDialog(null)
    })
  }

  // ─── Primary action ──────────────────────────────────────────────────────────

  function primaryLabel(): string {
    if (status === 'new') return 'Start Working'
    if (status === 'working') return 'Send Quote'
    if (status === 'quote_sent') return 'Mark Customer Approved'
    if (status === 'customer_approved') {
      if (partsStatus === 'in_checkout') return 'Resume Checkout'
      if (partsStatus === 'ordered') return 'View Order'
      if (partsStatus === 'parts_arranged') return 'Parts Details'
      return 'Order Parts'
    }
    if (status === 'closed_lost' || status === 'dismissed') return 'Reopen Quote'
    return ''
  }

  function handlePrimary() {
    if (status === 'new') {
      run(() => actionStartWorking(quoteId))
    } else if (status === 'working') {
      setDialog({ type: 'send' })
    } else if (status === 'quote_sent') {
      setDialog({ type: 'approve' })
    } else if (status === 'customer_approved') {
      if (partsStatus === 'in_checkout') {
        router.push('/dealer/shop/checkout')
      } else if (partsStatus === 'ordered') {
        router.push('/dealer/orders')
      } else if (partsStatus === 'parts_arranged') {
        // handled in secondary; primary same effect
      } else {
        onOrderParts()
      }
    } else if (status === 'closed_lost' || status === 'dismissed') {
      run(() => actionReopenQuote(quoteId))
    }
  }

  const label = primaryLabel()
  if (!label) return null

  // ─── Secondary actions ───────────────────────────────────────────────────────

  const canSend = status === 'working' || status === 'quote_sent'
  const canMarkSent = status === 'working'
  const canApproveFromWorking = status === 'working'
  const canApprove = status === 'quote_sent' || status === 'working'
  const canRevise = status === 'quote_sent' || status === 'customer_approved'
  const canLose = status === 'new' || status === 'working' || status === 'quote_sent' || status === 'customer_approved'
  const canDismiss = status === 'new' || status === 'working'
  const canPartsArranged = status === 'customer_approved' && partsStatus === 'not_ordered'
  const canUndoParts = partsStatus === 'parts_arranged'

  const hasSecondary = canSend || canMarkSent || canApproveFromWorking || canRevise || canLose || canDismiss || canPartsArranged || canUndoParts

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePrimary}
          disabled={pending}
          className="bg-[#FFC60B] font-semibold uppercase tracking-wide text-[#1E1E1E] hover:bg-[#FFC60B]/90"
        >
          {pending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
          {label}
        </Button>

        {hasSecondary && (
          <DropdownMenu>
            <DropdownMenuTrigger disabled={pending} className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {canSend && status === 'quote_sent' && (
                <DropdownMenuItem onSelect={() => setDialog({ type: 'send' })}>
                  Resend Quote
                </DropdownMenuItem>
              )}
              {canMarkSent && (
                <DropdownMenuItem onSelect={() => run(() => actionMarkAsSent(quoteId))}>
                  Mark as Sent
                </DropdownMenuItem>
              )}
              {canApproveFromWorking && (
                <DropdownMenuItem onSelect={() => setDialog({ type: 'approve' })}>
                  Mark Customer Approved
                </DropdownMenuItem>
              )}
              {canRevise && <DropdownMenuSeparator />}
              {canRevise && (
                <DropdownMenuItem onSelect={() => run(() => actionReviseQuote(quoteId))}>
                  Revise Quote
                </DropdownMenuItem>
              )}
              {canPartsArranged && (
                <DropdownMenuItem onSelect={onOrderParts}>
                  Order Parts
                </DropdownMenuItem>
              )}
              {canUndoParts && (
                <DropdownMenuItem onSelect={() => { /* handled via OrderPartsDrawer */ onOrderParts() }}>
                  View Parts Details
                </DropdownMenuItem>
              )}
              {(canLose || canDismiss) && <DropdownMenuSeparator />}
              {canLose && (
                <DropdownMenuItem
                  onSelect={() => setDialog({ type: 'lost' })}
                  className="text-destructive focus:text-destructive"
                >
                  Close as Lost
                </DropdownMenuItem>
              )}
              {canDismiss && (
                <DropdownMenuItem
                  onSelect={() => setDialog({ type: 'dismiss' })}
                  className="text-destructive focus:text-destructive"
                >
                  Dismiss
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setDialog(null) }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>

            {/* Send quote */}
            {dialog.type === 'send' && (
              <>
                <h2 className="mb-1 text-lg font-bold">
                  {status === 'quote_sent' ? 'Resend Quote' : 'Send Quote'}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Quote {displayNum} · {customerName}
                </p>
                <Textarea
                  placeholder="Optional message to customer…"
                  value={sendMsg}
                  onChange={(e) => setSendMsg(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                  <Button
                    disabled={pending}
                    onClick={() => run(() => actionSendQuote(quoteId, sendMsg))}
                    className="bg-[#FFC60B] font-semibold text-[#1E1E1E] hover:bg-[#FFC60B]/90"
                  >
                    {pending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                    {status === 'quote_sent' ? 'Resend' : 'Send'}
                  </Button>
                </div>
              </>
            )}

            {/* Customer approval */}
            {dialog.type === 'approve' && (
              <>
                <h2 className="mb-1 text-lg font-bold">Mark Customer Approved</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Quote {displayNum} · {customerName}
                </p>
                <input
                  type="text"
                  placeholder="Optional note — e.g. Approved by phone"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className="mb-4 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                  <Button
                    disabled={pending}
                    onClick={() => run(() => actionMarkCustomerApproved(quoteId, approveNote))}
                    className="bg-[#FFC60B] font-semibold text-[#1E1E1E] hover:bg-[#FFC60B]/90"
                  >
                    {pending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                    Confirm Approval
                  </Button>
                </div>
              </>
            )}

            {/* Close as lost */}
            {dialog.type === 'lost' && (
              <>
                <h2 className="mb-1 text-lg font-bold">Close as Lost</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Quote {displayNum} · {customerName}
                </p>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason
                </label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="mb-3 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
                {lostReason === 'Other' && (
                  <Textarea
                    placeholder="Required note for Other…"
                    value={lostNote}
                    onChange={(e) => setLostNote(e.target.value)}
                    rows={3}
                    className="mb-3"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={pending || (lostReason === 'Other' && !lostNote.trim())}
                    onClick={() => run(() => actionCloseAsLost(quoteId, lostReason, lostNote))}
                  >
                    {pending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                    Close as Lost
                  </Button>
                </div>
              </>
            )}

            {/* Dismiss */}
            {dialog.type === 'dismiss' && (
              <>
                <h2 className="mb-1 text-lg font-bold">Dismiss Quote</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Quote {displayNum} · {customerName}
                </p>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason
                </label>
                <select
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  className="mb-4 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  {DISMISS_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => run(() => actionDismiss(quoteId, dismissReason))}
                  >
                    {pending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                    Dismiss
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
