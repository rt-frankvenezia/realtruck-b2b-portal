import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { CreditApplicationForm } from '@/components/dealer/credit/CreditApplicationForm'

export default async function CreditApplicationApplyPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'submit_credit_application')) redirect('/dealer/credit')

  const supabase = await createClient()
  const { data: application } = await supabase
    .from('credit_applications')
    .select('*')
    .eq('company_id', user.profile.company_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!application || !['draft', 'additional_information_required'].includes(application.status)) {
    redirect('/dealer/credit')
  }

  const { data: documents } = await supabase
    .from('credit_application_documents')
    .select('*')
    .eq('application_id', application.id)
    .order('created_at')

  return <CreditApplicationForm application={application} documents={documents ?? []} />
}
