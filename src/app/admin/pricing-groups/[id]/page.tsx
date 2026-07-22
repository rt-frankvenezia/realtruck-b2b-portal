import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminPricingGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: group }, { data: rules }, { data: companies }] = await Promise.all([
    supabase.from('pricing_groups').select('*').eq('id', id).maybeSingle(),
    supabase.from('pricing_rules').select('*').eq('pricing_group_id', id),
    supabase.from('companies').select('id, name').eq('pricing_group_id', id),
  ])

  if (!group) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-muted-foreground">{group.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Discount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rules ?? []).map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.display_name}</TableCell>
                  <TableCell>{rule.target_type}</TableCell>
                  <TableCell className="text-right">{rule.discount_percent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Companies in this group</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {(companies ?? []).length > 0 ? (
            <ul className="flex flex-col gap-1">
              {(companies ?? []).map((c) => <li key={c.id}>{c.name}</li>)}
            </ul>
          ) : (
            <p className="text-muted-foreground">No companies assigned to this group yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
