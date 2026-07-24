import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hasFinancialPermission } from '@/lib/financial-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DownloadDocumentButton } from '@/components/dealer/financial/DownloadDocumentButton'
import { GenerateStatementForm } from '@/components/dealer/financial/GenerateStatementForm'
import { STATEMENT_STATUS_LABEL, STATEMENT_STATUS_VARIANT, formatDate } from '@/lib/status-labels'

export default async function StatementsPage() {
  const user = await getCurrentUser()
  if (!user || !user.profile.company_id) redirect('/dealer')
  if (!hasFinancialPermission(user.profile.role, 'download_statements')) redirect('/dealer')

  const supabase = await createClient()
  const { data: statements } = await supabase
    .from('statements')
    .select('*')
    .eq('company_id', user.profile.company_id)
    .order('period_start', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Statements</h1>
        <p className="text-muted-foreground">Generate and download account statements for any period.</p>
      </div>

      <GenerateStatementForm companyId={user.profile.company_id} />

      {!statements || statements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText size={40} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No statements yet. Generate one above for a specific period.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <div className="flex flex-col divide-y">
            {statements.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-semibold">
                    {formatDate(s.period_start)} – {formatDate(s.period_end)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.generated_at ? `Generated ${formatDate(s.generated_at)}` : 'Not yet generated'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATEMENT_STATUS_VARIANT[s.status]}>{STATEMENT_STATUS_LABEL[s.status]}</Badge>
                  {s.status === 'ready' && <DownloadDocumentButton label="Download Statement" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
