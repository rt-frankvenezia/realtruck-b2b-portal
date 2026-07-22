'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CHECKLIST_ITEM_LABEL,
  CONFIRMATION_STATUS_LABEL,
  ISSUE_TYPE_LABEL,
  PHOTO_CATEGORY_LABEL,
} from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type PhotoCategory = Database['public']['Enums']['photo_category']
type ChecklistItemKey = Database['public']['Enums']['checklist_item_key']
type IssueType = Database['public']['Enums']['issue_type']

const ALL_PHOTO_CATEGORIES: PhotoCategory[] = [
  'full_vehicle', 'rear_view', 'side_profile', 'front_clamp', 'wiring', 'accessories',
]
const REQUIRED_PHOTO_CATEGORIES: PhotoCategory[] = ['full_vehicle', 'rear_view', 'side_profile', 'front_clamp']

const ALL_CHECKLIST_ITEMS: ChecklistItemKey[] = [
  'correct_cap_model', 'options_installed', 'mechanical_tested', 'electrical_tested',
  'no_leaks_or_fitment_issues', 'customer_inspected', 'warranty_instructions_provided', 'answered_questions',
]
const REQUIRED_CHECKLIST_ITEMS: ChecklistItemKey[] = [
  'correct_cap_model', 'options_installed', 'mechanical_tested',
  'no_leaks_or_fitment_issues', 'customer_inspected', 'warranty_instructions_provided',
]

type PhotoWithUrl = Tables<'installation_photos'> & { url: string | null }

export type VerificationStatus = {
  can_submit: boolean
  is_submitted: boolean
  confirmation_status: Tables<'installation_confirmations'>['status'] | null
  open_issue_count: number
  payout_eligible: boolean
} | null

export function VerificationPanel({
  installationId,
  dealerStatus,
  photos,
  checklistItems,
  issues,
  confirmation,
  verificationStatus,
}: {
  installationId: string
  dealerStatus: Database['public']['Enums']['dealer_operational_status']
  photos: PhotoWithUrl[]
  checklistItems: Tables<'installation_checklist_items'>[]
  issues: Tables<'installation_issues'>[]
  confirmation: Tables<'installation_confirmations'> | null
  verificationStatus: VerificationStatus
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [issueType, setIssueType] = useState<IssueType>('poor_fitment')
  const [issueDescription, setIssueDescription] = useState('')
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const canSubmit = verificationStatus?.can_submit ?? false
  const isSubmitted = verificationStatus?.is_submitted ?? confirmation?.submitted_at != null
  const openIssues = issues.filter((issue) => issue.status === 'open')

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

  function handleUpload(category: PhotoCategory, file: File) {
    withErrorToast(async () => {
      const path = `installations/${installationId}/${category}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('installation-photos').upload(path, file)
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('installation_photos')
        .insert({ installation_id: installationId, category, storage_path: path })
      if (insertError) throw insertError

      toast.success(`Uploaded ${PHOTO_CATEGORY_LABEL[category]}`)
    })
  }

  function handleChecklistToggle(itemKey: ChecklistItemKey, checked: boolean) {
    withErrorToast(async () => {
      const { error } = await supabase
        .from('installation_checklist_items')
        .upsert({ installation_id: installationId, item_key: itemKey, checked }, { onConflict: 'installation_id,item_key' })
      if (error) throw error
    })
  }

  function handleSubmit() {
    withErrorToast(async () => {
      const { error } = await supabase.rpc('submit_installation_verification', { p_installation_id: installationId })
      if (error) throw error
      toast.success('Verification submitted')
    })
  }

  function handleConfirm() {
    withErrorToast(async () => {
      const { error } = await supabase.rpc('confirm_installation_completion', { p_installation_id: installationId })
      if (error) throw error
      toast.success('Installation confirmed')
    })
  }

  function handleReportIssue() {
    withErrorToast(async () => {
      const { error } = await supabase.rpc('report_installation_issue', {
        p_installation_id: installationId,
        p_issue_type: issueType,
        p_description: issueDescription,
      })
      if (error) throw error
      setIssueDialogOpen(false)
      setIssueDescription('')
      toast.success('Issue reported')
    })
  }

  function handleResolve(issueId: string) {
    withErrorToast(async () => {
      const { error } = await supabase.rpc('resolve_installation_issue', { p_issue_id: issueId })
      if (error) throw error
      toast.success('Issue resolved')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification</CardTitle>
        <CardDescription>
          Photos and checklist required before submitting. Once submitted, the customer confirms or reports an issue.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section>
          <h3 className="mb-3 text-sm font-medium">Photos</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ALL_PHOTO_CATEGORIES.map((category) => {
              const existing = photos.filter((p) => p.category === category)
              const required = REQUIRED_PHOTO_CATEGORIES.includes(category)
              return (
                <div key={category} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {PHOTO_CATEGORY_LABEL[category]}
                      {required && <span className="ml-1 text-destructive">*</span>}
                    </p>
                    {existing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {existing.map((photo) =>
                          photo.url ? (
                            <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                              View
                            </a>
                          ) : (
                            <span key={photo.id} className="text-xs text-muted-foreground">
                              Uploaded
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      ref={(el) => {
                        fileInputs.current[category] = el
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(category, file)
                        e.target.value = ''
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => fileInputs.current[category]?.click()}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <Separator />

        <section>
          <h3 className="mb-3 text-sm font-medium">Checklist</h3>
          <div className="flex flex-col gap-2">
            {ALL_CHECKLIST_ITEMS.map((itemKey) => {
              const item = checklistItems.find((i) => i.item_key === itemKey)
              const required = REQUIRED_CHECKLIST_ITEMS.includes(itemKey)
              return (
                <label key={itemKey} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={item?.checked ?? false}
                    disabled={isPending}
                    onCheckedChange={(checked) => handleChecklistToggle(itemKey, checked === true)}
                  />
                  <span>
                    {CHECKLIST_ITEM_LABEL[itemKey]}
                    {required && <span className="ml-1 text-destructive">*</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isSubmitted ? 'Submitted' : 'Not yet submitted'}
                {confirmation && (
                  <Badge variant="outline" className="ml-2">
                    {CONFIRMATION_STATUS_LABEL[confirmation.status]}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {dealerStatus === 'completed' || dealerStatus === 'in_progress'
                  ? canSubmit
                    ? 'All required items are present.'
                    : 'Complete all required photos and checklist items to submit.'
                  : 'Installation must be in progress before verification can be submitted.'}
              </p>
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
              {isSubmitted ? 'Resubmit' : 'Submit Verification'}
            </Button>
          </div>

          {isSubmitted && confirmation?.status !== 'confirmed' && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
              <p className="flex-1 text-muted-foreground">
                Awaiting customer response. Until the customer portal is wired up, you can record their response here.
              </p>
              <Button size="sm" variant="outline" onClick={handleConfirm} disabled={isPending || openIssues.length > 0}>
                Confirm
              </Button>
              <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
                <DialogTrigger render={<Button size="sm" variant="outline" disabled={isPending} />}>
                  Report Issue
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report an issue</DialogTitle>
                    <DialogDescription>This blocks payout eligibility until resolved.</DialogDescription>
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
                    <Textarea
                      placeholder="Describe the issue"
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleReportIssue} disabled={isPending || !issueDescription.trim()}>
                      Submit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {openIssues.length > 0 && (
            <div className="flex flex-col gap-2">
              {openIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <div>
                    <p className="font-medium">{ISSUE_TYPE_LABEL[issue.issue_type]}</p>
                    <p className="text-muted-foreground">{issue.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleResolve(issue.id)} disabled={isPending}>
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
