'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function RespondToInfoRequestForm({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [response, setResponse] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('respond_to_credit_info_request', { p_request_id: requestId, p_response: response })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Response submitted — application moved back to under review')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <Label htmlFor="info-response">Your response</Label>
      <Textarea
        id="info-response"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Describe what you're providing, or note that documents have been uploaded above."
      />
      <Button onClick={handleSubmit} disabled={isPending || !response.trim()} className="w-fit">
        Resubmit for Review
      </Button>
    </div>
  )
}
