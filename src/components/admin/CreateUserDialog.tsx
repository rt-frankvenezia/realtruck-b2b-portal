'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { USER_ROLE_LABEL } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type UserRole = Database['public']['Enums']['user_role']
const ASSIGNABLE_ROLES: UserRole[] = ['realtruck_admin', 'dealer_admin', 'location_admin', 'staff']

export function CreateUserDialog({
  companies,
  locations,
  defaultCompanyId,
}: {
  companies: { id: string; name: string }[]
  locations: { id: string; name: string; company_id: string }[]
  defaultCompanyId?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('staff')
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? '')
  const [locationIds, setLocationIds] = useState<string[]>([])
  const [result, setResult] = useState<{ tempPassword: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const companyLocations = useMemo(() => locations.filter((l) => l.company_id === companyId), [locations, companyId])
  const needsCompany = role !== 'realtruck_admin'

  function handleCreate() {
    startTransition(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          role,
          companyId: needsCompany ? companyId : null,
          locationIds: role === 'location_admin' ? locationIds : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create user')
        return
      }
      setResult({ tempPassword: data.tempPassword })
      router.refresh()
    })
  }

  function reset() {
    setOpen(false)
    setEmail('')
    setName('')
    setRole('staff')
    setCompanyId(defaultCompanyId ?? '')
    setLocationIds([])
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : reset())}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>New User</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Creates a real login immediately (no invite email is sent).</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>Account created. Share this temporary password with the user:</p>
            <code className="rounded bg-muted p-2 font-mono">{result.tempPassword}</code>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue>{USER_ROLE_LABEL[role]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {USER_ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsCompany && (
              <div className="flex flex-col gap-2">
                <Label>Company</Label>
                <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? '')} disabled={!!defaultCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company">
                      {companies.find((c) => c.id === companyId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {role === 'location_admin' && companyId && (
              <div className="flex flex-col gap-2">
                <Label>Locations</Label>
                {companyLocations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={locationIds.includes(loc.id)}
                      onCheckedChange={(checked) =>
                        setLocationIds((prev) => (checked ? [...prev, loc.id] : prev.filter((id) => id !== loc.id)))
                      }
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={reset}>Done</Button>
          ) : (
            <Button onClick={handleCreate} disabled={isPending || !email.trim() || !name.trim() || (needsCompany && !companyId)}>
              Create
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
