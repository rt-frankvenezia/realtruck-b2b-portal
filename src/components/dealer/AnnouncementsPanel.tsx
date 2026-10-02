'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/status-labels'
import type { Announcement } from '@/lib/announcements'

const PANEL = 'overflow-hidden rounded border border-[#d5d5d5] bg-white'
const PANEL_HEADER = 'bg-[#1E1E1E] px-4 py-3'

function AnnouncementDialog({
  announcement,
  onClose,
}: {
  announcement: Announcement | null
  onClose: () => void
}) {
  return (
    <Dialog open={announcement !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="pr-6 text-base leading-snug">{announcement?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{announcement ? formatDate(announcement.date) : ''}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {announcement?.tag}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{announcement?.body}</p>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

export function AnnouncementsPanel({
  announcements,
  limit,
}: {
  announcements: Announcement[]
  limit?: number
}) {
  const [selected, setSelected] = useState<Announcement | null>(null)
  const visible = limit ? announcements.slice(0, limit) : announcements
  const hasMore = limit !== undefined && announcements.length > limit

  if (announcements.length === 0) return null

  return (
    <>
      <div className={PANEL}>
        <div className={`${PANEL_HEADER} flex items-center justify-between`}>
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Megaphone size={15} />
            Announcements
          </span>
          <Link href="/dealer/announcements" className="text-xs text-white/60 hover:text-white transition-colors">
            View all
          </Link>
        </div>
        <div className="divide-y divide-[#f0f0f0]">
          {visible.map((ann) => (
            <button
              key={ann.id}
              onClick={() => setSelected(ann)}
              className="flex w-full items-start gap-4 px-4 py-3 text-left transition-colors hover:bg-[#fafafa] cursor-pointer"
            >
              <span className="w-24 shrink-0 pt-0.5 text-xs text-muted-foreground">{formatDate(ann.date)}</span>
              <span className="flex-1 text-sm">{ann.title}</span>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {ann.tag}
              </span>
            </button>
          ))}
          {hasMore && (
            <div className="px-4 py-3">
              <Link href="/dealer/announcements" className="text-sm text-primary hover:underline">
                View {announcements.length - limit!} more
              </Link>
            </div>
          )}
        </div>
      </div>

      <AnnouncementDialog announcement={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export function AnnouncementsPageList({ announcements }: { announcements: Announcement[] }) {
  const [selected, setSelected] = useState<Announcement | null>(null)

  return (
    <>
      <div className={PANEL}>
        <div className="divide-y divide-[#f0f0f0]">
          {announcements.map((ann) => (
            <button
              key={ann.id}
              onClick={() => setSelected(ann)}
              className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-[#fafafa] cursor-pointer"
            >
              <span className="w-24 shrink-0 pt-0.5 text-xs text-muted-foreground">{formatDate(ann.date)}</span>
              <span className="flex-1 text-sm font-medium">{ann.title}</span>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {ann.tag}
              </span>
            </button>
          ))}
          {announcements.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No announcements.</div>
          )}
        </div>
      </div>

      <AnnouncementDialog announcement={selected} onClose={() => setSelected(null)} />
    </>
  )
}
