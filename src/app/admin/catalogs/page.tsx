import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateCatalogDialog } from '@/components/admin/CreateCatalogDialog'
import { PURCHASE_ACCESS_LABEL } from '@/lib/restrictions'

export default async function AdminCatalogsPage() {
  const supabase = await createClient()
  const [{ data: catalogs }, { data: pricingRules }, { data: restrictionRules }, { data: programs }] = await Promise.all([
    supabase.from('catalogs').select('*').order('name'),
    supabase.from('pricing_rules').select('pricing_group_id'),
    supabase.from('restriction_rules').select('restriction_group_id'),
    supabase.from('dealer_programs').select('id, name, catalog_id').order('name'),
  ])

  const pricingRuleCountByGroup = new Map<string, number>()
  for (const r of pricingRules ?? []) {
    pricingRuleCountByGroup.set(r.pricing_group_id, (pricingRuleCountByGroup.get(r.pricing_group_id) ?? 0) + 1)
  }
  const restrictionRuleCountByGroup = new Map<string, number>()
  for (const r of restrictionRules ?? []) {
    restrictionRuleCountByGroup.set(r.restriction_group_id, (restrictionRuleCountByGroup.get(r.restriction_group_id) ?? 0) + 1)
  }
  const programsByCatalog = new Map<string, { id: string; name: string }[]>()
  for (const p of programs ?? []) {
    if (p.catalog_id) {
      const arr = programsByCatalog.get(p.catalog_id) ?? []
      arr.push({ id: p.id, name: p.name })
      programsByCatalog.set(p.catalog_id, arr)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalogs</h1>
          <p className="text-muted-foreground">
            A Catalog defines what dealers can purchase and what they pay. Each Catalog is assigned to one or more Dealer Programs.
          </p>
        </div>
        <CreateCatalogDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Assigned Programs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(catalogs ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No catalogs yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {(catalogs ?? []).map((catalog) => {
                const pricingRules = catalog.pricing_group_id ? (pricingRuleCountByGroup.get(catalog.pricing_group_id) ?? 0) : 0
                const availRules = catalog.restriction_group_id ? (restrictionRuleCountByGroup.get(catalog.restriction_group_id) ?? 0) : 0
                const assignedPrograms = programsByCatalog.get(catalog.id) ?? []
                return (
                  <TableRow key={catalog.id}>
                    <TableCell>
                      <Link href={`/admin/catalogs/${catalog.id}`} className="font-medium hover:underline">
                        {catalog.name}
                      </Link>
                      {catalog.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{catalog.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {pricingRules} {pricingRules === 1 ? 'rule' : 'rules'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {catalog.restriction_group_id ? (
                          <span className="text-sm text-muted-foreground">
                            {availRules} {availRules === 1 ? 'rule' : 'rules'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not configured</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignedPrograms.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedPrograms.map((p) => (
                            <Link key={p.id} href={`/admin/dealer-programs/${p.id}`}>
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted text-xs">
                                {p.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
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
