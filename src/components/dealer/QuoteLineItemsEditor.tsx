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

function EditablePrice({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const [raw, setRaw] = useState(String(value))
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

function EditableText({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (s: string) => void
  className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded border border-transparent bg-transparent focus:border-input focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring ${className ?? ''}`}
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

  const isARE = configMethod === 'are-consumer'
  const isAluminum = ACC_CONFIG_METHODS.has(configMethod ?? '')
  // MAP column shown for ARE + fiberglass; not for aluminum
  const showMapColumn = !isAluminum

  const { groups, extras } = groupItems(items)
  const firstBaseId = groups[0]?.base.id ?? null

  // Editability rules
  // Base: editable for aluminum/manually-added only (ARE base is locked)
  function baseDescEditable(item: LineItem): boolean {
    return isAluminum || isManuallyAdded(item)
  }
  function basePriceEditable(item: LineItem): boolean {
    return isAluminum || isManuallyAdded(item)
  }
  function baseRemovable(item: LineItem): boolean {
    // ARE first base is locked; aluminum/manually-added always removable
    if (isARE && item.id === firstBaseId) return false
    return true
  }

  // Options: desc editable for ARE, aluminum, and manually-added; price only for aluminum/manual
  function optionDescEditable(item: LineItem): boolean {
    return isARE || isAluminum || isManuallyAdded(item)
  }
  function optionPriceEditable(item: LineItem): boolean {
    return isAluminum || isManuallyAdded(item)
  }

  // Price (customer-facing) column is shown for non-aluminum items; editable for non-manually-added
  function itemHasMap(item: LineItem): boolean {
    return showMapColumn && !isManuallyAdded(item)
  }

  // Effective price for totals: MAP (msrp) when available, else dealer price
  function effectivePrice(item: LineItem): number {
    if (itemHasMap(item)) return Number(item.msrp)
    return Number(item.price)
  }

  function handleUpdate(id: string, changes: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleAddItem() {
    if (!newItemDesc.trim()) return
    const price = Number(newItemPrice) || 0
    setItems((prev) => [
      ...prev,
      {
        id: tempId(),
        quote_id: quoteId,
        description: newItemDesc.trim(),
        sku: null,
        price,
        msrp: isAluminum ? 0 : price,
        quantity: 1,
        is_required: false,
        type: 'base',
      },
    ])
    setNewItemDesc('')
    setNewItemPrice('')
    setAddingItem(false)
  }

  function handleAddOption() {
    if (!newOptionDesc.trim() || !addingOptionFor) return
    const price = Number(newOptionPrice) || 0
    const newOpt: LineItem = {
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
      if (baseIdx === -1) return [...prev, newOpt]
      let insertAt = baseIdx + 1
      while (insertAt < prev.length && prev[insertAt].type === 'option') insertAt++
      const next = [...prev]
      next.splice(insertAt, 0, newOpt)
      return next
    })
    setNewOptionDesc('')
    setNewOptionPrice('')
    setAddingOptionFor(null)
  }

  function handleAddDiscount() {
    const value = parseFloat(discountValue) || 0
    if (!value) return
    const sub = items
      .filter((i) => i.type !== 'discount')
      .reduce((s, i) => s + effectivePrice(i) * i.quantity, 0)
    const amount = discountType === '%' ? sub * (value / 100) : value
    const description =
      discountType === '%' ? `${value}% Discount` : `$${value.toFixed(2)} Discount`
    setItems((prev) => [
      ...prev,
      {
        id: tempId(),
        quote_id: quoteId,
        description,
        sku: null,
        price: -Math.abs(amount),
        msrp: 0,
        quantity: 1,
        is_required: false,
        type: 'discount',
      },
    ])
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

  const previewDiscountAmt =
    discountValue && parseFloat(discountValue)
      ? discountType === '%'
        ? itemsSubtotal * (parseFloat(discountValue) / 100)
        : parseFloat(discountValue)
      : null

  // Column grid template
  const cols = showMapColumn
    ? 'grid-cols-[minmax(0,1fr)_88px_88px_44px_88px_36px]'
    : 'grid-cols-[minmax(0,1fr)_88px_44px_88px_36px]'

  // Customer-facing Price cell — editable for MAP items, dash for manually-added/aluminum
  function PriceCell({ item, py }: { item: LineItem; py: string }) {
    if (!showMapColumn) return null
    if (!itemHasMap(item)) {
      return (
        <div className={`flex items-center justify-end px-3 ${py}`}>
          <span className="text-sm text-muted-foreground">—</span>
        </div>
      )
    }
    return (
      <div className={`flex items-center px-3 ${py}`}>
        <EditablePrice
          value={Number(item.msrp)}
          onChange={(n) => handleUpdate(item.id, { msrp: n })}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden rounded border border-[#d5d5d5]">
        {/* Header */}
        <div className={`grid ${cols} bg-[#1E1E1E] text-white`}>
          <div className="px-4 py-3 text-sm font-semibold">Item</div>
          <div className="px-3 py-3 text-right text-sm font-semibold">Your Price</div>
          {showMapColumn && (
            <div className="px-3 py-3 text-right text-sm font-semibold">Price</div>
          )}
          <div className="px-2 py-3 text-center text-sm font-semibold">Qty</div>
          <div className="px-3 py-3 text-right text-sm font-semibold">Total</div>
          <div />
        </div>

        {/* Line item groups */}
        {groups.map((group) => {
          const baseTotal =
            effectivePrice(group.base) * group.base.quantity +
            group.options.reduce((s, o) => s + effectivePrice(o) * o.quantity, 0)

          return (
            <div key={group.base.id} className="border-b last:border-b-0">
              {/* Base row */}
              <div className={`grid ${cols} items-center border-b border-muted`}>
                <div className="flex items-center px-4 py-3">
                  {baseDescEditable(group.base) ? (
                    <EditableText
                      value={group.base.description}
                      onChange={(s) => handleUpdate(group.base.id, { description: s })}
                      className="text-sm font-medium"
                    />
                  ) : (
                    <span className="text-sm font-medium">{group.base.description}</span>
                  )}
                </div>
                <div className="flex items-center px-3 py-3">
                  {basePriceEditable(group.base) ? (
                    <EditablePrice
                      value={Number(group.base.price)}
                      onChange={(n) => handleUpdate(group.base.id, { price: n, msrp: n })}
                    />
                  ) : (
                    <span className="block w-full text-right text-sm tabular-nums">
                      {formatCurrency(group.base.price)}
                    </span>
                  )}
                </div>
                <PriceCell item={group.base} py="py-3" />
                <div className="px-2 py-3 text-center text-sm">{group.base.quantity}</div>
                <div className="px-3 py-3 text-right text-sm font-semibold">
                  {formatCurrency(baseTotal)}
                </div>
                <div className="flex items-center justify-center">
                  {baseRemovable(group.base) && (
                    <button
                      onClick={() => handleRemove(group.base.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Options */}
              {group.options.length > 0 && (
                <div className="bg-muted/30">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Options
                  </p>
                  {group.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`grid ${cols} items-center border-t border-muted/50`}
                    >
                      <div className="flex items-center px-6 py-2">
                        {optionDescEditable(opt) ? (
                          <EditableText
                            value={opt.description}
                            onChange={(s) => handleUpdate(opt.id, { description: s })}
                            className="text-sm text-muted-foreground"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{opt.description}</span>
                        )}
                      </div>
                      <div className="flex items-center px-3 py-2">
                        {optionPriceEditable(opt) ? (
                          <EditablePrice
                            value={Number(opt.price)}
                            onChange={(n) => handleUpdate(opt.id, { price: n, msrp: n })}
                          />
                        ) : (
                          <span className="block w-full text-right text-sm tabular-nums text-muted-foreground">
                            {formatCurrency(opt.price)}
                          </span>
                        )}
                      </div>
                      <PriceCell item={opt} py="py-2" />
                      <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                        {opt.quantity}
                      </div>
                      <div className="px-3 py-2 text-right text-sm text-muted-foreground">
                        {formatCurrency(effectivePrice(opt) * opt.quantity)}
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleRemove(opt.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </div>
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

        {/* Extras: discounts / standalone custom items */}
        {extras.map((item) => (
          <div
            key={item.id}
            className={`grid ${cols} items-center border-b last:border-b-0 bg-muted/10`}
          >
            <div className="px-4 py-3 text-sm italic text-muted-foreground">
              {item.description}
            </div>
            <div
              className={`px-3 py-3 text-right text-sm ${item.type === 'discount' ? 'text-red-500' : ''}`}
            >
              {formatCurrency(item.price)}
            </div>
            {showMapColumn && (
              <div className="px-3 py-3 text-right text-sm text-muted-foreground">—</div>
            )}
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {item.quantity}
            </div>
            <div
              className={`px-3 py-3 text-right text-sm font-semibold ${item.type === 'discount' ? 'text-red-500' : ''}`}
            >
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
              {previewDiscountAmt !== null && (
                <span className="min-w-[72px] text-right text-sm font-medium text-red-500">
                  −{formatCurrency(previewDiscountAmt)}
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
