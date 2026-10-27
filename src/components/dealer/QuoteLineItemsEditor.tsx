'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  actionAddQuoteLineItem,
  actionAddQuoteOption,
  actionAddQuoteDiscount,
  actionRemoveQuoteLineItem,
} from '@/lib/actions/quotes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/status-labels'
import type { Tables } from '@/lib/database.types'

type LineItem = Tables<'quote_line_items'>
type Group = { base: LineItem; options: LineItem[] }

function groupItems(items: LineItem[]): { groups: Group[]; extras: LineItem[] } {
  const groups: Group[] = []
  const extras: LineItem[] = []
  let current: Group | null = null
  for (const item of items) {
    if (item.type === 'base') {
      current = { base: item, options: [] }
      groups.push(current)
    } else if (item.type === 'option' && current) {
      current.options.push(item)
    } else {
      current = null
      extras.push(item)
    }
  }
  return { groups, extras }
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
  const [isPending, startTransition] = useTransition()

  const [addingItem, setAddingItem] = useState(false)
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')

  const [addingOptionFor, setAddingOptionFor] = useState<string | null>(null)
  const [newOptionDesc, setNewOptionDesc] = useState('')
  const [newOptionPrice, setNewOptionPrice] = useState('')

  const [addingDiscount, setAddingDiscount] = useState(false)
  const [discountValue, setDiscountValue] = useState('')
  const [discountType, setDiscountType] = useState<'%' | '$'>('%')

  const [localTax, setLocalTax] = useState(
    taxRate ? (Number(taxRate) * 100).toFixed(2) : '0.00',
  )

  const { groups, extras } = groupItems(lineItems)

  const itemsSubtotal = lineItems
    .filter((i) => i.type !== 'discount')
    .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const discountTotal = lineItems
    .filter((i) => i.type === 'discount')
    .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const subtotal = itemsSubtotal + discountTotal
  const taxAmount = subtotal * (parseFloat(localTax) / 100 || 0)
  const total = subtotal + taxAmount

  function handleAddItem() {
    if (!newItemDesc.trim()) return
    startTransition(async () => {
      try {
        await actionAddQuoteLineItem(quoteId, newItemDesc.trim(), Number(newItemPrice) || 0)
        setNewItemDesc('')
        setNewItemPrice('')
        setAddingItem(false)
      } catch {
        toast.error('Failed to add item')
      }
    })
  }

  function handleAddOption() {
    if (!newOptionDesc.trim() || !addingOptionFor) return
    startTransition(async () => {
      try {
        await actionAddQuoteOption(quoteId, addingOptionFor, newOptionDesc.trim(), Number(newOptionPrice) || 0)
        setNewOptionDesc('')
        setNewOptionPrice('')
        setAddingOptionFor(null)
      } catch {
        toast.error('Failed to add option')
      }
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await actionRemoveQuoteLineItem(id, quoteId)
      } catch {
        toast.error('Failed to remove item')
      }
    })
  }

  function handleAddDiscount() {
    const value = parseFloat(discountValue) || 0
    if (!value) return
    const amount =
      discountType === '%' ? itemsSubtotal * (value / 100) : value
    const description =
      discountType === '%' ? `${value}% Discount` : `$${value.toFixed(2)} Discount`
    startTransition(async () => {
      try {
        await actionAddQuoteDiscount(quoteId, description, amount)
        setDiscountValue('')
        setDiscountType('%')
        setAddingDiscount(false)
      } catch {
        toast.error('Failed to add discount')
      }
    })
  }

  const previewDiscountAmount =
    discountValue && parseFloat(discountValue)
      ? discountType === '%'
        ? itemsSubtotal * (parseFloat(discountValue) / 100)
        : parseFloat(discountValue)
      : null

  return (
    <div className="flex flex-col">
      {/* Items table */}
      <div className="overflow-hidden rounded border border-[#d5d5d5]">
        <div className="grid grid-cols-[1fr_120px_60px_100px_36px] bg-[#1E1E1E] text-white">
          <div className="px-4 py-3 text-sm font-semibold">Item</div>
          <div className="px-3 py-3 text-sm font-semibold">Price</div>
          <div className="px-3 py-3 text-center text-sm font-semibold">Qty</div>
          <div className="px-3 py-3 text-right text-sm font-semibold">Total</div>
          <div />
        </div>

        {/* Item groups */}
        {groups.map((group) => {
          const groupTotal =
            Number(group.base.price) * group.base.quantity +
            group.options.reduce((s, o) => s + Number(o.price) * o.quantity, 0)
          return (
            <div key={group.base.id} className="border-b last:border-b-0">
              {/* Base row */}
              <div className="grid grid-cols-[1fr_120px_60px_100px_36px] items-center border-b border-muted">
                <div className="px-4 py-3 text-sm font-medium">{group.base.description}</div>
                <div className="px-3 py-3 text-sm">{formatCurrency(group.base.price)}</div>
                <div className="px-3 py-3 text-center text-sm">{group.base.quantity}</div>
                <div className="px-3 py-3 text-right text-sm font-semibold">{formatCurrency(groupTotal)}</div>
                <div />
              </div>

              {/* Options */}
              {group.options.length > 0 && (
                <div className="bg-muted/30">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Option
                  </p>
                  {group.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="grid grid-cols-[1fr_120px_60px_100px_36px] items-center border-t border-muted/50"
                    >
                      <div className="px-6 py-2 text-sm text-muted-foreground">{opt.description}</div>
                      <div className="px-3 py-2 text-sm text-muted-foreground">{formatCurrency(opt.price)}</div>
                      <div className="px-3 py-2 text-center text-sm text-muted-foreground">{opt.quantity}</div>
                      <div />
                      <button
                        onClick={() => handleRemove(opt.id)}
                        disabled={isPending}
                        className="flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-40"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add option */}
              {addingOptionFor === group.base.id ? (
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
                    <Button
                      size="sm"
                      onClick={handleAddOption}
                      disabled={isPending || !newOptionDesc.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingOptionFor(null)
                        setNewOptionDesc('')
                        setNewOptionPrice('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-muted/40 px-4 py-2">
                  <button
                    onClick={() => setAddingOptionFor(group.base.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    + ADD OPTION
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Discount / custom standalone rows */}
        {extras.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_120px_60px_100px_36px] items-center border-b last:border-b-0 bg-muted/10"
          >
            <div className="px-4 py-3 text-sm italic text-muted-foreground">{item.description}</div>
            <div
              className={`px-3 py-3 text-sm ${item.type === 'discount' ? 'text-red-500' : ''}`}
            >
              {formatCurrency(item.price)}
            </div>
            <div className="px-3 py-3 text-center text-sm text-muted-foreground">{item.quantity}</div>
            <div
              className={`px-3 py-3 text-right text-sm font-semibold ${item.type === 'discount' ? 'text-red-500' : ''}`}
            >
              {formatCurrency(Number(item.price) * item.quantity)}
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              disabled={isPending}
              className="flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {groups.length === 0 && extras.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No items yet. Add an item to get started.
          </div>
        )}
      </div>

      {/* Bottom actions + totals */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Add item form */}
          {addingItem ? (
            <div className="flex gap-2">
              <Input
                placeholder="Item description"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
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
              <Button size="sm" onClick={handleAddItem} disabled={isPending || !newItemDesc.trim()}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingItem(false)
                  setNewItemDesc('')
                  setNewItemPrice('')
                }}
              >
                Cancel
              </Button>
            </div>
          ) : addingDiscount ? (
            /* Add discount form */
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Discount:</span>
              <input
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="h-8 w-20 rounded border border-input bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="0"
                autoFocus
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as '%' | '$')}
                className="h-8 rounded border border-input bg-background px-2 text-sm"
              >
                <option value="%">%</option>
                <option value="$">$</option>
              </select>
              {previewDiscountAmount !== null && (
                <span className="min-w-[72px] text-right text-sm font-medium text-red-500">
                  −{formatCurrency(previewDiscountAmount)}
                </span>
              )}
              <Button size="sm" onClick={handleAddDiscount} disabled={isPending || !discountValue}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingDiscount(false)
                  setDiscountValue('')
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddingItem(true)}>
                + ADD ITEM
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingDiscount(true)}>
                + ADD DISCOUNT
              </Button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-8">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(itemsSubtotal)}</span>
          </div>
          {discountTotal < 0 && (
            <div className="flex items-center justify-between gap-8">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-red-500">{formatCurrency(discountTotal)}</span>
            </div>
          )}
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
