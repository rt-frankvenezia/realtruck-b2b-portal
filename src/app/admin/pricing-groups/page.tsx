import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreatePricingGroupDialog } from '@/components/admin/CreatePricingGroupDialog'
import { PRICING_GROUP_STATUS_LABEL, PRICING_GROUP_STATUS_VARIANT } from '@/lib/status-labels'

export default async function AdminPricingGroupsPage() {
  const supabase = await createClient()
  const [{ data: groups }, { data: rules }, { data: companies }] = await Promise.all([
    supabase.from('pricing_groups').select('*').order('name'),
    supabase.from('pricing_rules').select('pricing_group_id'),
    supabase.from('companies').select('pricing_group_id'),
  ])

  const ruleCountByGroup = new Map<string, number>()
  for (const r of rules ?? []) {
    ruleCountByGroup.set(r.pricing_group_id, (ruleCountByGroup.get(r.pricing_group_id) ?? 0) + 1)
  }
  const dealerCountByGroup = new Map<string, number>()
  for (const c of companies ?? []) {
    if (c.pricing_group_id) dealerCountByGroup.set(c.pricing_group_id, (dealerCountByGroup.get(c.pricing_group_id) ?? 0) + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pricing Groups</h1>
          <p className="text-muted-foreground">Volume discount tiers assignable to a company.</p>
        </div>
        <CreatePricingGroupDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Base Discount</TableHead>
                <TableHead className="text-right">Rules</TableHead>
                <TableHead className="text-right">Dealers</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(groups ?? []).map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Link href={`/admin/pricing-groups/${group.id}`} className="font-medium hover:underline">
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell>{group.description ?? '—'}</TableCell>
                  <TableCell className="text-right">{group.base_discount}%</TableCell>
                  <TableCell className="text-right">{ruleCountByGroup.get(group.id) ?? 0}</TableCell>
                  <TableCell className="text-right">{dealerCountByGroup.get(group.id) ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={PRICING_GROUP_STATUS_VARIANT[group.status]}>{PRICING_GROUP_STATUS_LABEL[group.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
