'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/status-labels'
import type { Tables } from '@/lib/database.types'

type LineItem = Tables<'quote_line_items'>

type Group = { base: LineItem; options: LineItem[] }

function groupItems(items: LineItem[]): Group[] {
  const groups: Group[] = []
  let current: Group | null = null
  for (const item of items) {
    if (item.type === 'base') {
      current = { base: item, options: [] }
      groups.push(current)
    } else if (current) {
      current.options.push(item)
    }
  }
  return groups
}

export function QuoteLineItemsEditor({
  quoteId,
  lineItems,
  taxRate,
}: {
  quoteId: string
  lineItems: LineItem[]
  taxRate?: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [addingItemToGroupId, setAddingItemToGroupId] = useState<string | null>(null)
  const [newOptionDesc, setNewOptionDesc] = useState('')
  const [newOptionPrice, setNewOptionPrice] = useState('')
  const [localTax, setLocalTax] = useState(taxRate ? (Number(taxRate) * 100).toFixed(2) : '0.00')

  const groups = groupItems(lineItems)
  const subtotal = lineItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const taxAmount = subtotal * (parseFloat(localTax) / 100 || 0)
  const total = subtotal + taxAmount

  function handleAddOption(baseId: string) {
    if (!newOptionDesc.trim()) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('quote_line_items').insert({
        quote_id: quoteId,
        description: newOptionDesc.trim(),
        price: Number(newOptionPrice) || 0,
        msrp: Number(newOptionPrice) || 0,
        quantity: 1,
        is_required: false,
        type: 'option',
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setNewOptionDesc('')
      setNewOptionPrice('')
      setAddingItemToGroupId(null)
      router.refresh()
    })
  }

  function handleAddItem() {
    if (!newItemDescription.trim()) return
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('quote_line_items').insert({
        quote_id: quoteId,
        description: newItemDescription.trim(),
        price: Number(newItemPrice) || 0,
        msrp: Number(newItemPrice) || 0,
        quantity: 1,
        is_required: false,
        type: 'base',
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setNewItemDescription('')
      setNewItemPrice('')
      router.refresh()
    })
  }

  function handleRemoveItem(id: string) {
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
    <div className="flex flex-col">
      {/* Items table */}
      <div className="overflow-hidden rounded border border-[#d5d5d5]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_60px_100px_36px] gap-0 bg-[#1E1E1E] text-white">
          <div className="px-4 py-3 text-sm font-semibold">Item</div>
          <div className="px-3 py-3 text-sm font-semibold">Price</div>
          <div className="px-3 py-3 text-sm font-semibold text-center">Qty</div>
          <div className="px-3 py-3 text-sm font-semibold text-right">Total</div>
          <div />
        </div>

        {groups.map((group) => {
          const groupTotal = (Number(group.base.price) * group.base.quantity) +
            group.options.reduce((s, o) => s + Number(o.price) * o.quantity, 0)
          return (
            <div key={group.base.id} className="border-b last:border-b-0">
              {/* Base item row */}
              <div className="grid grid-cols-[1fr_120px_60px_100px_36px] items-center gap-0 border-b border-muted">
                <div className="px-4 py-3 text-sm font-medium">{group.base.description}</div>
                <div className="px-3 py-3">
                  <span className="text-sm">{formatCurrency(group.base.price)}</span>
                </div>
                <div className="px-3 py-3 text-center text-sm">{group.base.quantity}</div>
                <div className="px-3 py-3 text-right text-sm font-semibold">{formatCurrency(groupTotal)}</div>
                <div />
              </div>

              {/* Options */}
              {group.options.length > 0 && (
                <div className="bg-muted/30">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Option</p>
                  {group.options.map((opt) => (
                    <div key={opt.id} className="grid grid-cols-[1fr_120px_60px_100px_36px] items-center gap-0 border-t border-muted/50">
                      <div className="px-6 py-2 text-sm text-muted-foreground">{opt.description}</div>
                      <div className="px-3 py-2 text-sm text-muted-foreground">{formatCurrency(opt.price)}</div>
                      <div className="px-3 py-2 text-center text-sm text-muted-foreground">{opt.quantity}</div>
                      <div />
                      <button
                        onClick={() => handleRemoveItem(opt.id)}
                        disabled={isPending}
                        className="flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-40"
                        title="Remove option"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add option row */}
              {addingItemToGroupId === group.base.id ? (
                <div className="border-t border-muted bg-muted/20 px-4 py-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Option description"
                      value={newOptionDesc}
                      onChange={(e) => setNewOptionDesc(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newOptionPrice}
                      onChange={(e) => setNewOptionPrice(e.target.value)}
                      className="w-24"
                    />
                    <Button size="sm" onClick={() => handleAddOption(group.base.id)} disabled={isPending || !newOptionDesc.trim()}>
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingItemToGroupId(null); setNewOptionDesc(''); setNewOptionPrice('') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-muted/40 px-4 py-2">
                  <button
                    onClick={() => setAddingItemToGroupId(group.base.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    + ADD OPTION
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No items yet. Add an item to get started.
          </div>
        )}
      </div>

      {/* Bottom actions + totals */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex gap-2">
          {addingItemToGroupId === '__new__' ? (
            <div className="flex gap-2">
              <Input
                placeholder="Item description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="w-56"
                autoFocus
              />
              <Input
                type="number"
                placeholder="Price"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-24"
              />
              <Button size="sm" onClick={handleAddItem} disabled={isPending || !newItemDescription.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingItemToGroupId(null); setNewItemDescription(''); setNewItemPrice('') }}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setAddingItemToGroupId('__new__')}>
                + ADD ITEM
              </Button>
              <Button size="sm" variant="outline" disabled>
                + ADD DISCOUNT
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-8">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax (%)</span>
              <input
                type="number"
                value={localTax}
                onChange={(e) => setLocalTax(e.target.value)}
                className="h-7 w-16 rounded border border-input bg-background px-2 text-right text-sm"
                step="0.01"
                min="0"
              />
            </div>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-8 border-t pt-1.5 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
