'use client'

import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// No real files back these resources — this is a UI-structure demo, not a
// document management system. Downloading shows a toast instead of pretending
// a file transferred.
export function DownloadResourceButton({ title }: { title: string }) {
  return (
    <Button variant="outline" size="sm" className="mt-auto" onClick={() => toast.info(`${title} would download here`)}>
      <Download size={16} />
      Download
    </Button>
  )
}
