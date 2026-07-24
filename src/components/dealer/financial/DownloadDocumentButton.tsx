'use client'

import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

// Decorative — same posture as the Resources & Sales Tools download button
// (Round 5): there's no real generated PDF behind this in the prototype,
// docs 02 §11 explicitly allow "generated sample PDFs or placeholder
// download files," and building real PDF generation is out of scope here.
export function DownloadDocumentButton({ label = 'Download' }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => toast.success(`${label} would download as a PDF`)}>
      <Download size={14} />
      {label}
    </Button>
  )
}
