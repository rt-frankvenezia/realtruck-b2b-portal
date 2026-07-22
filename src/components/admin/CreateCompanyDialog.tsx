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

export function CreateCompanyDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('companies').insert({ name, code })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`${name} created — pending provisioning`)
      setOpen(false)
      setName('')
      setCode('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New Company</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New dealer company</DialogTitle>
          <DialogDescription>Starts in pending_provisioning — add a location and dealer admin next.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="company-name">Name</Label>
            <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company-code">Code</Label>
            <Input id="company-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BST-004" />
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
