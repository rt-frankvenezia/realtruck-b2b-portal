import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function AdminPricingGroupsPage() {
  const supabase = await createClient()
  const [{ data: pricingGroups }, { data: pricingRules }, { data: companies }] = await Promise.all([
    supabase.from('pricing_groups').select('*').order('name'),
    supabase.from('pricing_rules').select('pricing_group_id'),
    supabase.from('companies').select('id, pricing_group_id').not('pricing_group_id', 'is', null),
  ])

  const ruleCountByGroup = new Map<string, number>()
  for (const r of pricingRules ?? []) {
    ruleCountByGroup.set(r.pricing_group_id, (ruleCountByGroup.get(r.pricing_group_id) ?? 0) + 1)
  }

  const dealerCountByGroup = new Map<string, number>()
  for (const c of companies ?? []) {
    if (c.pricing_group_id) {
      dealerCountByGroup.set(c.pricing_group_id, (dealerCountByGroup.get(c.pricing_group_id) ?? 0) + 1)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pricing Groups</h1>
          <p className="text-muted-foreground">
            A Pricing Group defines what dealers pay — base discount, volume tiers, and product-level overrides.
          </p>
        </div>
        <Button variant="outline" disabled>
          <Plus className="mr-1 h-4 w-4" />
          Create
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base Discount</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead>Dealers</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pricingGroups ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No pricing groups yet.
                  </TableCell>
                </TableRow>
              )}
              {(pricingGroups ?? []).map((pg) => {
                const ruleCount = ruleCountByGroup.get(pg.id) ?? 0
                const dealerCount = dealerCountByGroup.get(pg.id) ?? 0
                return (
                  <TableRow key={pg.id}>
                    <TableCell>
                      <Link href={`/admin/pricing-groups/${pg.id}`} className="font-medium hover:underline">
                        {pg.name}
                      </Link>
                      {pg.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{pg.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{pg.base_discount}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {dealerCount === 0 ? 'Unassigned' : `${dealerCount} ${dealerCount === 1 ? 'dealer' : 'dealers'}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pg.status === 'active' ? 'success' : 'secondary'}>
                        {pg.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
