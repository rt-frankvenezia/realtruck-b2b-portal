'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { QUOTE_STATUS_LABEL } from '@/lib/status-labels'
import type { Database, Tables } from '@/lib/database.types'

type QuoteStatus = Database['public']['Enums']['quote_status']
const ALL_STATUSES: QuoteStatus[] = ['new', 'working', 'quote_sent', 'converted', 'lost', 'spam', 'invalid', 'test']

export function AdminQuoteEditDialog({ quote }: { quote: Tables<'quotes'> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(quote.customer_name)
  const [email, setEmail] = useState(quote.customer_email)
  const [phone, setPhone] = useState(quote.customer_phone ?? '')
  const [year, setYear] = useState(quote.vehicle_year?.toString() ?? '')
  const [make, setMake] = useState(quote.vehicle_make ?? '')
  const [model, setModel] = useState(quote.vehicle_model ?? '')
  const [status, setStatus] = useState<QuoteStatus>(quote.status)
  const [justification, setJustification] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('admin_edit_quote', {
        p_quote_id: quote.id,
        p_customer_name: name,
        p_customer_email: email,
        p_customer_phone: phone || undefined,
        p_vehicle_year: year ? Number(year) : undefined,
        p_vehicle_make: make || undefined,
        p_vehicle_model: model || undefined,
        p_status: status,
        p_justification: justification,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Quote updated')
      setOpen(false)
      setJustification('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin edit — {quote.customer_name}</DialogTitle>
          <DialogDescription>Overrides are logged to the quote timeline and the audit log.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Year</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Make</Label>
              <Input value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Model</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus)}>
              <SelectTrigger>
                <SelectValue>{QUOTE_STATUS_LABEL[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {QUOTE_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Justification (required)</Label>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Why is this override needed?" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || !justification.trim()}>
            Save Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
