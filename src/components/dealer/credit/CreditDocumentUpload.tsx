'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CREDIT_DOCUMENT_STATUS_LABEL, CREDIT_DOCUMENT_STATUS_VARIANT } from '@/lib/status-labels'
import type { Database } from '@/lib/database.types'

type CreditDocument = Database['public']['Tables']['credit_application_documents']['Row']

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

export function CreditDocumentUpload({
  applicationId,
  documentType,
  isRequired,
  existingDocument,
  onChange,
}: {
  applicationId: string
  documentType: string
  isRequired: boolean
  existingDocument: CreditDocument | null
  onChange: (document: CreditDocument) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Accepted file types: PDF, PNG, JPG')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Maximum file size is 10 MB')
      return
    }

    setIsUploading(true)
    const supabase = createClient()
    const path = `${applicationId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('credit-application-documents').upload(path, file)
    if (uploadError) {
      toast.error(uploadError.message)
      setIsUploading(false)
      return
    }

    const payload = {
      application_id: applicationId,
      document_type: documentType,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: path,
      status: 'uploaded' as const,
      is_required: isRequired,
      uploaded_at: new Date().toISOString(),
    }

    const { data, error } = existingDocument
      ? await supabase.from('credit_application_documents').update(payload).eq('id', existingDocument.id).select().single()
      : await supabase.from('credit_application_documents').insert(payload).select().single()

    setIsUploading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    onChange(data)
    toast.success(`${documentType} uploaded`)
  }

  async function handleRemove() {
    if (!existingDocument) return
    const supabase = createClient()
    if (existingDocument.storage_path) {
      await supabase.storage.from('credit-application-documents').remove([existingDocument.storage_path])
    }
    const { error } = await supabase.from('credit_application_documents').delete().eq('id', existingDocument.id)
    if (error) {
      toast.error(error.message)
      return
    }
    onChange({ ...existingDocument, id: existingDocument.id, status: 'uploading', file_name: '', storage_path: null } as CreditDocument)
    toast.success('Document removed')
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div className="flex items-center gap-3">
        <FileText size={20} className="text-muted-foreground" />
        <div>
          <div className="text-sm font-semibold">
            {documentType}
            {isRequired && <span className="text-destructive"> *</span>}
          </div>
          {existingDocument?.file_name ? (
            <div className="text-xs text-muted-foreground">{existingDocument.file_name}</div>
          ) : (
            <div className="text-xs text-muted-foreground">PDF, PNG, or JPG — up to 10 MB</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {existingDocument?.status && existingDocument.file_name && (
          <Badge variant={CREDIT_DOCUMENT_STATUS_VARIANT[existingDocument.status]}>
            {CREDIT_DOCUMENT_STATUS_LABEL[existingDocument.status]}
          </Badge>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        {existingDocument?.file_name && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={handleRemove} title="Remove">
              <X size={16} />
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <Upload size={14} />
          {existingDocument?.file_name ? 'Replace' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}
