'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type FitmentRow = {
  id: string
  sku: string
  year_start: number
  year_end: number
  make: string
  model: string
  notes: string | null
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
          <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
          <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function FitmentTable({ sku }: { sku: string }) {
  const [rows, setRows] = useState<FitmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('sku_fitment')
      .select('*')
      .eq('sku', sku)
      .order('make', { ascending: true })
      .order('model', { ascending: true })
      .order('year_start', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [sku])

  const hasNotes = rows.some((r) => r.notes)

  if (!loading && rows.length === 0) {
    return (
      <p className="rounded-md border px-4 py-6 text-center text-sm text-muted-foreground">
        No fitment data available for this product.
      </p>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="whitespace-nowrap">Year Range</TableHead>
            <TableHead>Make</TableHead>
            <TableHead>Model</TableHead>
            {hasNotes && <TableHead>Notes</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {row.year_start === row.year_end
                    ? String(row.year_start)
                    : `${row.year_start} – ${row.year_end}`}
                </TableCell>
                <TableCell>{row.make}</TableCell>
                <TableCell>{row.model}</TableCell>
                {hasNotes && (
                  <TableCell className="text-muted-foreground">{row.notes ?? '—'}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
