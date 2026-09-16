'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateDealerProgramDialog({
  catalogs,
}: {
  catalogs: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dealer_programs')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
        })
        .select('id')
        .single()
      if (error) { toast.error(error.message); return }
      toast.success(`${name.trim()} created`)
      setOpen(false)
      setName('')
      setDescription('')
      router.push(`/admin/dealer-programs/${data.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus size={16} className="mr-1" />New Dealer Program</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New dealer program</DialogTitle>
          <DialogDescription>
            A Dealer Program groups dealers into a commercial tier. Assign a Catalog after creating it to define their pricing and availability.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dp-name">Program Name *</Label>
            <Input id="dp-name" placeholder="e.g. Standard Dealer Direct" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dp-desc">Description</Label>
            <Textarea id="dp-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {catalogs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No catalogs yet — create a Catalog first, then assign it to this program.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>Create Program</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
