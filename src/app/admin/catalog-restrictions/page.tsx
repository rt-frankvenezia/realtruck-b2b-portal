import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateRestrictionGroupDialog } from '@/components/admin/CreateRestrictionGroupDialog'
import { PURCHASE_ACCESS_LABEL } from '@/lib/restrictions'

export default async function AdminCatalogRestrictionsPage() {
  const supabase = await createClient()
  const [{ data: groups }, { data: rules }, { data: companies }] = await Promise.all([
    supabase.from('restriction_groups').select('*').order('name'),
    supabase.from('restriction_rules').select('restriction_group_id'),
    supabase.from('companies').select('restriction_group_id'),
  ])

  const ruleCountByGroup = new Map<string, number>()
  for (const r of rules ?? []) {
    ruleCountByGroup.set(r.restriction_group_id, (ruleCountByGroup.get(r.restriction_group_id) ?? 0) + 1)
  }
  const dealerCountByGroup = new Map<string, number>()
  for (const c of companies ?? []) {
    if (c.restriction_group_id) {
      dealerCountByGroup.set(c.restriction_group_id, (dealerCountByGroup.get(c.restriction_group_id) ?? 0) + 1)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalog Restrictions</h1>
          <p className="text-muted-foreground">Control which products a dealer account is authorized to purchase.</p>
        </div>
        <CreateRestrictionGroupDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default Access</TableHead>
                <TableHead className="text-right">Rules</TableHead>
                <TableHead className="text-right">Dealers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(groups ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No restriction groups yet.
                  </TableCell>
                </TableRow>
              )}
              {(groups ?? []).map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Link href={`/admin/catalog-restrictions/${group.id}`} className="font-medium hover:underline">
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{group.description ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={group.default_access === 'allowed' ? 'default' : 'destructive'}>
                      {PURCHASE_ACCESS_LABEL[group.default_access]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{ruleCountByGroup.get(group.id) ?? 0}</TableCell>
                  <TableCell className="text-right">{dealerCountByGroup.get(group.id) ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
