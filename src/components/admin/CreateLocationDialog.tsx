'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateLocationDialog({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('locations').insert({ company_id: companyId, name, code, city, state })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`${name} created — pending approval`)
      setOpen(false)
      setName('')
      setCode('')
      setCity('')
      setState('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>New Location</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New location</DialogTitle>
          <DialogDescription>Starts in pending_approval — approve it once it&apos;s ready to go live.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="location-name">Name</Label>
            <Input id="location-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location-code">Code</Label>
            <Input id="location-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="location-city">City</Label>
              <Input id="location-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="location-state">State</Label>
              <Input id="location-state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isPending || !name.trim() || !code.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
