'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Mode = 'review' | 'approve' | 'reject'

export function LocationApprovalDialog({
  locationId,
  companyIsActive,
}: {
  locationId: string
  companyIsActive: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('review')
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setOpen(false)
    setMode('review')
    setCode('')
    setNote('')
    setReason('')
  }

  function handleApprove() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('approve_location', {
        p_location_id: locationId,
        p_location_code: code,
        p_internal_note: note || undefined,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Location approved')
      reset()
      router.refresh()
    })
  }

  function handleReject() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('reject_location', { p_location_id: locationId, p_reason: reason })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Location rejected')
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : reset())}>
      <DialogTrigger render={<Button size="sm" />}>Review</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'review' && 'Review location'}
            {mode === 'approve' && 'Approve location'}
            {mode === 'reject' && 'Reject location'}
          </DialogTitle>
          <DialogDescription>Pending location approval.</DialogDescription>
        </DialogHeader>

        {mode === 'review' && (
          <div className="flex flex-col gap-3">
            {!companyIsActive && (
              <Alert variant="destructive">
                <AlertDescription>
                  This location&apos;s company is not active — it cannot be approved until the company is active.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {mode === 'approve' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="approve-code">Location Code</Label>
              <Input
                id="approve-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. BST-005"
              />
              <p className="text-xs text-muted-foreground">3-10 characters — uppercase letters, numbers, hyphens.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="approve-note">Internal Note (optional)</Label>
              <Textarea id="approve-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}

        {mode === 'reject' && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
        )}

        <DialogFooter>
          {mode === 'review' && (
            <>
              <Button variant="outline" onClick={() => setMode('reject')}>
                Reject
              </Button>
              <Button onClick={() => setMode('approve')} disabled={!companyIsActive}>
                Approve
              </Button>
            </>
          )}
          {mode === 'approve' && (
            <>
              <Button variant="outline" onClick={() => setMode('review')}>
                Back
              </Button>
              <Button onClick={handleApprove} disabled={isPending || !/^[A-Z0-9-]{3,10}$/.test(code)}>
                Confirm Approval
              </Button>
            </>
          )}
          {mode === 'reject' && (
            <>
              <Button variant="outline" onClick={() => setMode('review')}>
                Back
              </Button>
              <Button onClick={handleReject} disabled={isPending || !reason.trim()}>
                Confirm Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
