'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ISSUE_TYPE_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type IssueType = Database['public']['Enums']['issue_type']

export function CustomerOrderActions({ installationId }: { installationId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [issueType, setIssueType] = useState<IssueType>('poor_fitment')
  const [description, setDescription] = useState('')

  function withErrorToast(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  function handleConfirm() {
    withErrorToast(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('confirm_installation_completion', { p_installation_id: installationId })
      if (error) throw error
      toast.success('Thanks for confirming!')
    })
  }

  function handleReportIssue() {
    withErrorToast(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('report_installation_issue', {
        p_installation_id: installationId,
        p_issue_type: issueType,
        p_description: description,
      })
      if (error) throw error
      setIssueDialogOpen(false)
      setDescription('')
      toast.success('Thanks — the dealer has been notified.')
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleConfirm} disabled={isPending}>
        Everything looks good
      </Button>
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogTrigger render={<Button variant="outline" disabled={isPending} />}>Report an issue</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
            <DialogDescription>We&apos;ll let your dealer know right away.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select value={issueType} onValueChange={(v) => setIssueType(v as IssueType)}>
              <SelectTrigger>
                <SelectValue>{ISSUE_TYPE_LABEL[issueType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ISSUE_TYPE_LABEL) as IssueType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {ISSUE_TYPE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Tell us what happened" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleReportIssue} disabled={isPending || !description.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
