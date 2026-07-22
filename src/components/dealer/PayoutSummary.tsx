import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_VARIANT, formatCurrency } from '@/lib/status-labels'
import type { Tables } from '@/lib/database.types'

export function PayoutSummary({ payout }: { payout: Tables<'payouts'> | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout</CardTitle>
        <CardDescription>Created once the customer confirms with no open issues.</CardDescription>
      </CardHeader>
      <CardContent>
        {payout ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={PAYOUT_STATUS_VARIANT[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cap Revenue Share</span>
              <span>{formatCurrency(payout.cap_rev_share)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Installation Fee</span>
              <span>{formatCurrency(payout.installation_fee)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 font-medium">
              <span>Total Payout</span>
              <span>{formatCurrency(payout.payout_amount)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payout yet — this is created automatically once the customer confirms the installation.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
