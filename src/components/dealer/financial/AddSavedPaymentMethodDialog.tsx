'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

type CompanyLocation = { id: string; name: string }

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex'] as const
const ACCOUNT_TYPES = ['Checking', 'Savings'] as const

export function AddSavedPaymentMethodDialog({
  companyId,
  userId,
  isDealerAdmin,
  companyLocations,
  userLocationIds,
}: {
  companyId: string
  userId: string
  isDealerAdmin: boolean
  companyLocations: CompanyLocation[]
  userLocationIds: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'card' | 'bank_account'>('card')
  const [isPending, startTransition] = useTransition()
  const [verifying, setVerifying] = useState(false)

  // Card fields
  const [cardBrand, setCardBrand] = useState<string>('Visa')
  const [cardLast4, setCardLast4] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardLabel, setCardLabel] = useState('')

  // Bank fields
  const [bankName, setBankName] = useState('')
  const [bankAccountType, setBankAccountType] = useState<string>('Checking')
  const [bankLast4, setBankLast4] = useState('')
  const [bankLabel, setBankLabel] = useState('')
  const [bankVerified, setBankVerified] = useState(false)

  // Scope (dealer_admin only — location_admin auto-scoped to their locations)
  const [scope, setScope] = useState<'all' | 'selected'>(isDealerAdmin ? 'all' : 'selected')
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    isDealerAdmin ? [] : userLocationIds
  )

  function resetForm() {
    setTab('card')
    setCardBrand('Visa')
    setCardLast4('')
    setCardExp('')
    setCardLabel('')
    setBankName('')
    setBankAccountType('Checking')
    setBankLast4('')
    setBankLabel('')
    setBankVerified(false)
    setScope(isDealerAdmin ? 'all' : 'selected')
    setSelectedLocationIds(isDealerAdmin ? [] : userLocationIds)
  }

  function toggleLocation(id: string) {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  async function handleVerify() {
    setVerifying(true)
    await new Promise((r) => setTimeout(r, 1000))
    setBankVerified(true)
    setVerifying(false)
  }

  function handleSave() {
    const isCard = tab === 'card'
    if (isCard && (!cardLast4.trim() || !cardExp.trim())) return
    if (!isCard && (!bankName.trim() || !bankLast4.trim())) return

    const displayInfo = isCard
      ? { brand: cardBrand, last4: cardLast4.trim(), exp: cardExp.trim() }
      : { bank: bankName.trim(), account_type: bankAccountType, last4: bankLast4.trim(), verified: bankVerified }

    const locationScope = isDealerAdmin ? scope : 'selected'
    const locationIds = locationScope === 'all' ? [] : (isDealerAdmin ? selectedLocationIds : userLocationIds)

    startTransition(async () => {
      const supabase = createClient()
      const { data: method, error } = await supabase
        .from('saved_payment_methods')
        .insert({
          company_id: companyId,
          type: tab,
          label: (isCard ? cardLabel : bankLabel).trim() || null,
          display_info: displayInfo,
          location_scope: locationScope,
          created_by: userId,
        })
        .select('id')
        .single()

      if (error || !method) {
        toast.error(error?.message ?? 'Failed to save payment method')
        return
      }

      if (locationScope === 'selected' && locationIds.length > 0) {
        const { error: locError } = await supabase
          .from('saved_payment_method_locations')
          .insert(locationIds.map((lid) => ({ payment_method_id: method.id, location_id: lid })))
        if (locError) {
          toast.error(locError.message)
          return
        }
      }

      toast.success('Payment method saved')
      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  const canSave =
    tab === 'card'
      ? cardLast4.trim().length === 4 && cardExp.trim().length > 0
      : bankName.trim().length > 0 && bankLast4.trim().length === 4

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus size={14} className="mr-1" />
        Add Method
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'card' | 'bank_account')}>
          <TabsList className="w-full">
            <TabsTrigger value="card" className="flex-1">Card</TabsTrigger>
            <TabsTrigger value="bank_account" className="flex-1">Bank Account</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Card Type</Label>
              <Select value={cardBrand} onValueChange={(v) => setCardBrand(v ?? 'Visa')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Last 4 Digits *</Label>
                <Input
                  placeholder="4242"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Expiration *</Label>
                <Input
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardExp}
                  onChange={(e) => setCardExp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Label (optional)</Label>
              <Input placeholder="e.g. Corporate Visa" value={cardLabel} onChange={(e) => setCardLabel(e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="bank_account" className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Bank Name *</Label>
              <Input placeholder="e.g. Chase" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Account Type</Label>
                <Select value={bankAccountType} onValueChange={(v) => setBankAccountType(v ?? 'Checking')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Last 4 Digits *</Label>
                <Input
                  placeholder="6789"
                  maxLength={4}
                  value={bankLast4}
                  onChange={(e) => setBankLast4(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Label (optional)</Label>
              <Input placeholder="e.g. Denver Operations Account" value={bankLabel} onChange={(e) => setBankLabel(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">
                Verification:{' '}
                <span className={bankVerified ? 'font-semibold text-green-700' : 'font-semibold text-amber-600'}>
                  {bankVerified ? 'Verified' : 'Pending'}
                </span>
              </span>
              {!bankVerified && (
                <Button size="sm" variant="outline" onClick={handleVerify} disabled={verifying}>
                  {verifying ? 'Verifying…' : 'Verify'}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Location scope — dealer_admin can choose; location_admin auto-scoped */}
        {isDealerAdmin && companyLocations.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Availability</p>
            <div className="flex flex-col gap-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} />
                All Locations
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" checked={scope === 'selected'} onChange={() => setScope('selected')} />
                Specific Locations
              </label>
            </div>
            {scope === 'selected' && (
              <div className="ml-5 flex flex-col gap-1">
                {companyLocations.map((loc) => (
                  <label key={loc.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedLocationIds.includes(loc.id)}
                      onChange={() => toggleLocation(loc.id)}
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
