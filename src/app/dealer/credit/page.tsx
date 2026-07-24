import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, FileText } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StartApplicationButton } from '@/components/dealer/credit/StartApplicationButton'
import { CreditApplicationStatusView } from '@/components/dealer/credit/CreditApplicationStatusView'

export default async function CreditApplicationPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  const role = user.profile.role
  if (!hasFinancialPermission(role, 'submit_credit_application') && !hasFinancialPermission(role, 'view_credit_status')) {
    redirect('/dealer')
  }

  const supabase = await createClient()
  const { data: application } = await supabase
    .from('credit_applications')
    .select('*')
    .eq('company_id', user.profile.company_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!application) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Credit Application</h1>
          <p className="text-muted-foreground">Apply for payment terms to order on credit instead of by card.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <div className="max-w-md">
              <p className="font-semibold">Apply for credit terms to place eligible wholesale orders using your approved payment terms.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Approval is required. You may continue paying by credit card until terms are activated. Typical review
                takes a few business days.
              </p>
            </div>
            {hasFinancialPermission(role, 'submit_credit_application') ? (
              <StartApplicationButton companyId={user.profile.company_id} />
            ) : (
              <p className="text-sm text-muted-foreground">Contact your dealer admin to start a credit application.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Credit Application</h1>
          <p className="text-muted-foreground">Reference {application.reference_number}</p>
        </div>
        {application.status === 'active' && (
          <Button variant="outline" size="sm" render={<Link href="/dealer" />} nativeButton={false}>
            <CheckCircle size={16} />
            Terms Active
          </Button>
        )}
      </div>
      <CreditApplicationStatusView application={application} canEdit={hasFinancialPermission(role, 'submit_credit_application')} />
    </div>
  )
}
