import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminAuditLogPage() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('audit_log')
    .select('*, users(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground">Every administrative action, in order.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.users?.name ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.target_type} · {entry.target_id?.slice(0, 8)}
                  </TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {(entries ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No audit log entries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
