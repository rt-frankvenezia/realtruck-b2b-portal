'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/status-labels'
import type { Tables } from '@/lib/database.types'

export function QuoteLineItemsEditor({ quoteId, lineItems }: { quoteId: string; lineItems: Tables<'quote_line_items'>[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newDescription, setNewDescription] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const included = lineItems.filter((i) => i.type !== 'custom')
  const custom = lineItems.filter((i) => i.type === 'custom')
  const total = lineItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)

  function handleAddCustomItem() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('quote_line_items').insert({
        quote_id: quoteId,
        description: newDescription,
        price: Number(newPrice) || 0,
        msrp: Number(newPrice) || 0,
        quantity: 1,
        is_required: false,
        type: 'custom',
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setNewDescription('')
      setNewPrice('')
      router.refresh()
    })
  }

  function handleRemoveCustomItem(id: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('quote_line_items').delete().eq('id', id)
      if (error) {
        toast.error(error.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Included</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {included.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.description}
                  {item.is_required && <span className="ml-1 text-xs text-muted-foreground">(required)</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground capitalize">{item.type}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Custom Items</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {custom.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveCustomItem(item.id)} disabled={isPending}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <Input placeholder="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </TableCell>
              <TableCell>
                <Input type="number" placeholder="0.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="text-right" />
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={handleAddCustomItem} disabled={isPending || !newDescription.trim()}>
                  Add
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end border-t pt-3 text-sm font-semibold">Total: {formatCurrency(total)}</div>
    </div>
  )
}
