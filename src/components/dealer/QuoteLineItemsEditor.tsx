'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/status-labels'
import { ACC_CONFIG_METHODS } from '@/lib/quote-config'
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

function tempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function isManuallyAdded(item: LineItem): boolean {
  return item.id.startsWith('tmp-')
}

// Editable price cell — used only for aluminum / manually-added items
function EditablePrice({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const [raw, setRaw] = useState<string>(() => String(value))
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={raw}
      placeholder="0.00"
      onChange={(e) => {
        setRaw(e.target.value)
        const n = parseFloat(e.target.value)
        if (!isNaN(n)) onChange(n)
      }}
      onBlur={() => {
        if (raw === '' || isNaN(parseFloat(raw))) {
          setRaw('0')
          onChange(0)
        }
      }}
      className="w-full rounded border border-transparent bg-transparent text-right text-sm tabular-nums focus:border-input focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield]"
    />
  )
}

export function QuoteLineItemsEditor({
  quoteId,
  lineItems: initialItems,
  taxRate,
  configMethod,
}: {
  quoteId: string
  lineItems: LineItem[]
  taxRate?: number | null
  configMethod?: string | null
}) {
  const [items, setItems] = useState<LineItem[]>(initialItems)

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

  // Derived config flags
  const isAluminum = ACC_CONFIG_METHODS.has(configMethod ?? '')
  const isARE = configMethod === 'are-consumer'
  // MAP column shown for ARE and fiberglass methods (not aluminum)
  const showMapColumn = !isAluminum

  const { groups, extras } = groupItems(items)

  // First base item id (locked on ARE quotes)
  const firstBaseId = groups[0]?.base.id ?? null

  function isLockedBase(item: LineItem): boolean {
    return isARE && item.id === firstBaseId
  }

  // Can edit description: aluminum items OR manually-added items (not ARE locked base)
  function descEditable(item: LineItem): boolean {
    if (isLockedBase(item)) return false
    return isAluminum || isManuallyAdded(item)
  }

  // Can edit Your Price: aluminum items OR manually-added items
  function priceEditable(item: LineItem): boolean {
    if (isLockedBase(item)) return false
    return isAluminum || isManuallyAdded(item)
  }

  // MAP shown for this item: only when showMapColumn AND not manually added
  function itemHasMap(item: LineItem): boolean {
    return showMapColumn && !isManuallyAdded(item)
  }

  // Effective price for totals/subtotals: MAP if available, else dealer price
  function effectivePrice(item: LineItem): number {
    if (itemHasMap(item)) return Number(item.msrp)
    return Number(item.price)
  }

  function handleUpdateItem(id: string, changes: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }

  function handleAddItem() {
    if (!newItemDesc.trim()) return
    const price = Number(newItemPrice) || 0
    const newItem: LineItem = {
      id: tempId(),
      quote_id: quoteId,
      description: newItemDesc.trim(),
      sku: null,
      price,
      msrp: isAluminum ? 0 : price,
      quantity: 1,
      is_required: false,
      type: 'base',
    }
    setItems((prev) => [...prev, newItem])
    setNewItemDesc('')
    setNewItemPrice('')
    setAddingItem(false)
  }

  function handleAddOption() {
    if (!newOptionDesc.trim() || !addingOptionFor) return
    const price = Number(newOptionPrice) || 0
    const newOption: LineItem = {
      id: tempId(),
      quote_id: quoteId,
      description: newOptionDesc.trim(),
      sku: null,
      price,
      msrp: isAluminum ? 0 : price,
      quantity: 1,
      is_required: false,
      type: 'option',
    }
    setItems((prev) => {
      const baseIdx = prev.findIndex((i) => i.id === addingOptionFor)
      if (baseIdx === -1) return [...prev, newOption]
      let insertAt = baseIdx + 1
      while (insertAt < prev.length && prev[insertAt].type === 'option') insertAt++
      const next = [...prev]
      next.splice(insertAt, 0, newOption)
      return next
    })
    setNewOptionDesc('')
    setNewOptionPrice('')
    setAddingOptionFor(null)
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleAddDiscount() {
    const value = parseFloat(discountValue) || 0
    if (!value) return
    const subtotal = items
      .filter((i) => i.type !== 'discount')
      .reduce((s, i) => s + effectivePrice(i) * i.quantity, 0)
    const amount = discountType === '%' ? subtotal * (value / 100) : value
    const description =
      discountType === '%' ? `${value}% Discount` : `$${value.toFixed(2)} Discount`
    const newDiscount: LineItem = {
      id: tempId(),
      quote_id: quoteId,
      description,
      sku: null,
      price: -Math.abs(amount),
      msrp: 0,
      quantity: 1,
      is_required: false,
      type: 'discount',
    }
    setItems((prev) => [...prev, newDiscount])
    setDiscountValue('')
    setDiscountType('%')
    setAddingDiscount(false)
  }

  const itemsSubtotal = items
    .filter((i) => i.type !== 'discount')
    .reduce((sum, i) => sum + effectivePrice(i) * i.quantity, 0)
  const discountTotal = items
    .filter((i) => i.type === 'discount')
    .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const subtotal = itemsSubtotal + discountTotal
  const taxAmount = subtotal * (parseFloat(localTax) / 100 || 0)
  const total = subtotal + taxAmount

  const previewDiscountAmount =
    discountValue && parseFloat(discountValue)
      ? discountType === '%'
        ? itemsSubtotal * (parseFloat(discountValue) / 100)
        : parseFloat(discountValue)
      : null

  // Column grid — 6 cols with MAP, 5 without
  const headerCols = showMapColumn
    ? 'grid-cols-[minmax(0,1fr)_88px_88px_44px_88px_36px]'
    : 'grid-cols-[minmax(0,1fr)_88px_44px_88px_36px]'

  function RowCells({
    item,
    isOption = false,
    locked = false,
  }: {
    item: LineItem
    isOption?: boolean
    locked?: boolean
  }) {
    const canRemove = !locked
    const groupTotal = effectivePrice(item) * item.quantity

    return (
      <>
        {/* Description */}
        <div className={`flex items-center px-4 ${isOption ? 'py-2' : 'py-3'}`}>
          {descEditable(item) ? (
            <input
              type="text"
              value={item.description}
              onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
              className={`w-full rounded border border-transparent bg-transparent focus:border-input focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring ${isOption ? 'text-sm text-muted-foreground' : 'text-sm font-medium'}`}
            />
          ) : (
            <span className={isOption ? 'text-sm text-muted-foreground' : 'text-sm font-medium'}>
              {item.description}
            </span>
          )}
        </div>

        {/* Your Price */}
        <div className={`flex items-center px-3 ${isOption ? 'py-2' : 'py-3'}`}>
          {priceEditable(item) ? (
            <EditablePrice
              value={Number(item.price)}
              onChange={(n) => handleUpdateItem(item.id, { price: n, msrp: n })}
            />
          ) : (
            <span className={`block w-full text-right text-sm tabular-nums ${isOption ? 'text-muted-foreground' : ''}`}>
              {formatCurrency(item.price)}
            </span>
          )}
        </div>

        {/* MAP — read-only published price; only shown for fiberglass/ARE configurator items */}
        {showMapColumn && (
          <div className={`flex items-center justify-end px-3 ${isOption ? 'py-2' : 'py-3'}`}>
            {itemHasMap(item) ? (
              <span className={`text-sm tabular-nums ${isOption ? 'text-muted-foreground' : ''}`}>
                {formatCurrency(item.msrp)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        )}

        {/* Qty */}
        <div className={`px-2 text-center ${isOption ? 'py-2' : 'py-3'} text-sm ${isOption ? 'text-muted-foreground' : ''}`}>
          {item.quantity}
        </div>

        {/* Total */}
        <div className={`px-3 text-right ${isOption ? 'py-2 text-sm text-muted-foreground' : 'py-3 text-sm font-semibold'}`}>
          {formatCurrency(groupTotal)}
        </div>

        {/* Remove */}
        <div className="flex items-center justify-center">
          {canRemove ? (
            <button
              onClick={() => handleRemove(item.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden rounded border border-[#d5d5d5]">
        {/* Header */}
        <div className={`grid ${headerCols} bg-[#1E1E1E] text-white`}>
          <div className="px-4 py-3 text-sm font-semibold">Item</div>
          <div className="px-3 py-3 text-right text-sm font-semibold">Your Price</div>
          {showMapColumn && (
            <div className="px-3 py-3 text-right text-sm font-semibold">MAP</div>
          )}
          <div className="px-2 py-3 text-center text-sm font-semibold">Qty</div>
          <div className="px-3 py-3 text-right text-sm font-semibold">Total</div>
          <div />
        </div>

        {/* Groups */}
        {groups.map((group) => {
          const locked = isLockedBase(group.base)
          const groupTotal =
            effectivePrice(group.base) * group.base.quantity +
            group.options.reduce((s, o) => s + effectivePrice(o) * o.quantity, 0)

          return (
            <div key={group.base.id} className="border-b last:border-b-0">
              {/* Base row */}
              <div className={`grid ${headerCols} items-center border-b border-muted`}>
                <RowCells item={group.base} locked={locked} />
              </div>

              {/* Options */}
              {group.options.length > 0 && (
                <div className="bg-muted/30">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Options
                  </p>
                  {group.options.map((opt) => (
                    <div key={opt.id} className={`grid ${headerCols} items-center border-t border-muted/50`}>
                      <RowCells item={opt} isOption />
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={newOptionPrice}
                      onChange={(e) => setNewOptionPrice(e.target.value)}
                      className="w-24"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <Button size="sm" onClick={handleAddOption} disabled={!newOptionDesc.trim()}>
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

        {/* Extras (discounts / standalone custom) */}
        {extras.map((item) => (
          <div
            key={item.id}
            className={`grid ${headerCols} items-center border-b last:border-b-0 bg-muted/10`}
          >
            <div className="px-4 py-3 text-sm italic text-muted-foreground">
              {item.description}
            </div>
            <div className={`px-3 py-3 text-right text-sm ${item.type === 'discount' ? 'text-red-500' : ''}`}>
              {formatCurrency(item.price)}
            </div>
            {showMapColumn && <div className="px-3 py-3 text-right text-sm text-muted-foreground">—</div>}
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">{item.quantity}</div>
            <div className={`px-3 py-3 text-right text-sm font-semibold ${item.type === 'discount' ? 'text-red-500' : ''}`}>
              {formatCurrency(Number(item.price) * item.quantity)}
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={() => handleRemove(item.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {groups.length === 0 && extras.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No items yet. Add an item to get started.
          </div>
        )}
      </div>

      {/* Actions + Totals */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          {addingItem ? (
            <div className="flex gap-2">
              <Input
                placeholder="Item description"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="w-56"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Input
                type="number"
                placeholder="Price"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Button size="sm" onClick={handleAddItem} disabled={!newItemDesc.trim()}>
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddDiscount()}
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
              <Button size="sm" onClick={handleAddDiscount} disabled={!discountValue}>
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

        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-8">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(itemsSubtotal)}</span>
          </div>
          {discountTotal < 0 && (
            <div className="flex items-center justify-between gap-8">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium tabular-nums text-red-500">
                {formatCurrency(discountTotal)}
              </span>
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
            <span className="font-medium tabular-nums">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-8 border-t pt-1.5 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
