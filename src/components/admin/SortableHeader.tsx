'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export function SortableHeader({ column, label }: { column: string; label: string }) {
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort')
  const currentDir = searchParams.get('dir') ?? 'asc'
  const isActive = currentSort === column
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc'

  const params = new URLSearchParams(searchParams)
  params.set('sort', column)
  params.set('dir', nextDir)

  return (
    <Link href={`?${params.toString()}`} className="flex items-center gap-1 hover:text-foreground">
      {label}
      {isActive ? (
        currentDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      ) : (
        <ChevronsUpDown size={14} className="opacity-40" />
      )}
    </Link>
  )
}
