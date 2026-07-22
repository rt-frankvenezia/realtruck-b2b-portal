import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminPricingGroupsPage() {
  const supabase = await createClient()
  const { data: groups } = await supabase.from('pricing_groups').select('*').order('name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pricing Groups</h1>
        <p className="text-muted-foreground">Volume discount tiers assignable to a company.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Base Discount</TableHead>
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
                  <TableCell>{group.base_discount}%</TableCell>
                  <TableCell>
                    <Badge variant={group.status === 'active' ? 'default' : 'outline'}>{group.status}</Badge>
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
