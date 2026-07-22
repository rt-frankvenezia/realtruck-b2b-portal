import { DEALER_STATUS_LABEL } from '@/lib/status-labels'
import type { Tables } from '@/lib/database.types'

const SOURCE_LABEL: Record<Tables<'installation_status_history'>['source'], string> = {
  dealer: 'Dealer',
  erp: 'ERP',
  rt_admin: 'RT Admin',
  customer: 'Customer',
}

export function StatusHistoryTimeline({ entries }: { entries: Tables<'installation_status_history'>[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id} className="text-sm">
          <p className="font-medium">
            {entry.from_status ? `${DEALER_STATUS_LABEL[entry.from_status]} → ` : ''}
            {DEALER_STATUS_LABEL[entry.to_status]}
          </p>
          <p className="text-xs text-muted-foreground">
            {SOURCE_LABEL[entry.source]} · {new Date(entry.created_at).toLocaleString()}
          </p>
          {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}
