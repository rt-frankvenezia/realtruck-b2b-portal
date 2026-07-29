'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'] as const

// Mirrors AddBankAccountDialog.tsx — same "mocked, no real capture" posture.
// No card number, CVV, or billing address is ever collected, only brand +
// last four + expiry, purely for display at checkout.
export function AddPaymentCardDialog({ companyId, isFirstCard }: { companyId: string; isFirstCard: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [cardBrand, setCardBrand] = useState<(typeof CARD_BRANDS)[number]>('Visa')
  const [lastFour, setLastFour] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setOpen(false)
    setCardBrand('Visa')
    setLastFour('')
    setExpiryMonth('')
    setExpiryYear('')
  }

  function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from('payment_cards').insert({
        company_id: companyId,
        card_brand: cardBrand,
        last_four: lastFour,
        expiry_month: Number(expiryMonth),
        expiry_year: Number(expiryYear),
        is_default: isFirstCard,
        created_by_user_id: user?.id,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Card added')
      reset()
      router.refresh()
    })
  }

  const monthNum = Number(expiryMonth)
  const yearNum = Number(expiryYear)
  const isValid = /^\d{4}$/.test(lastFour) && monthNum >= 1 && monthNum <= 12 && yearNum >= 2000 && yearNum <= 2099

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : reset())}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus size={16} />
        Add Card
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
          <DialogDescription>Save a card to use for wholesale order checkout.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              This is a mocked secure connection for the prototype — no real card number, expiration, or CVV is
              collected or stored.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-brand">Card Brand</Label>
            <select
              id="card-brand"
              value={cardBrand}
              onChange={(e) => setCardBrand(e.target.value as (typeof CARD_BRANDS)[number])}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CARD_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-last-four">Last 4 Digits</Label>
            <Input
              id="card-last-four"
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-expiry-month">Expiry Month</Label>
              <Input
                id="card-expiry-month"
                maxLength={2}
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, ''))}
                placeholder="MM"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-expiry-year">Expiry Year</Label>
              <Input
                id="card-expiry-year"
                maxLength={4}
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, ''))}
                placeholder="2028"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            Save Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
