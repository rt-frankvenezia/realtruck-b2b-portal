'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Location = {
  id: string
  name: string
  code: string
  city: string
  state: string
  company_id: string
  company_name: string
}

export function AdminQuoteReassignDialog({
  quoteId,
  quoteDisplayNum,
  currentLocationName,
  locations,
}: {
  quoteId: string
  quoteDisplayNum: string
  currentLocationName: string
  locations: Location[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = locations.filter((loc) => {
    const q = search.toLowerCase()
    return (
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.company_name.toLowerCase().includes(q)
    )
  })

  function handleReassign() {
    if (!selectedId) return
    const loc = locations.find((l) => l.id === selectedId)
    if (!loc) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('quotes')
        .update({ location_id: selectedId, company_id: loc.company_id })
        .eq('id', quoteId)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Quote reassigned to ${loc.name}`)
      setOpen(false)
      setSearch('')
      setSelectedId(null)
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Reassign Quote
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <button
              onClick={() => { setOpen(false); setSearch(''); setSelectedId(null) }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold">Reassign Quote to Different Dealer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a new dealer location for quote {quoteDisplayNum}.
            </p>

            <div className="mt-4 rounded-md border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
              Current Location: <span className="font-medium text-foreground">{currentLocationName}</span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm font-medium">Search for a Location</p>
              <Input
                placeholder="Search by location name, company, city or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mt-3">
              <p className="mb-2 text-sm font-medium">Available Locations</p>
              <div className="max-h-52 overflow-y-auto rounded-md border">
                {filtered.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No locations found.</p>
                ) : (
                  filtered.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedId(loc.id)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted ${
                        selectedId === loc.id ? 'bg-primary/10 font-medium' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium">{loc.company_name}</p>
                        <p className="text-xs text-muted-foreground">{loc.city}, {loc.state}</p>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{loc.code}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => { setOpen(false); setSearch(''); setSelectedId(null) }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleReassign} disabled={isPending || !selectedId}>
                Reassign Quote
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
