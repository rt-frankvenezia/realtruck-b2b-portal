'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/components/customer/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/status-labels'
import type { Tables } from '@/lib/database.types'

type LocationOption = Pick<Tables<'location_directory'>, 'id' | 'name' | 'city' | 'state'>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clear } = useCart()
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [locationId, setLocationId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('location_directory')
      .select('id, name, city, state')
      .order('name')
      .then(({ data }) => setLocations(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/customer/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name, email, phone },
        vehicle: { year: year ? Number(year) : null, make, model },
        locationId,
        items,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to submit')
      setSubmitting(false)
      return
    }

    clear()
    router.push(`/order-submitted/${data.quoteId}`)
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">Your cart is empty.</p>
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installing dealer</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={locationId} onValueChange={(v) => setLocationId(v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a dealer location">
                  {locations.find((l) => l.id === locationId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} — {l.city}, {l.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
          <Button type="submit" size="lg" disabled={submitting || !locationId}>
            {submitting ? 'Submitting…' : 'Submit Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
