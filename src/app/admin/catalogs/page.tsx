import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateCatalogDialog } from '@/components/admin/CreateCatalogDialog'

export default async function AdminCatalogsPage() {
  const supabase = await createClient()
  const [{ data: catalogs }, { data: restrictionRules }, { data: companies }] = await Promise.all([
    supabase.from('catalogs').select('*').order('name'),
    supabase.from('restriction_rules').select('restriction_group_id'),
    supabase.from('companies').select('id, catalog_id').not('catalog_id', 'is', null),
  ])

  const restrictionRuleCountByGroup = new Map<string, number>()
  for (const r of restrictionRules ?? []) {
    restrictionRuleCountByGroup.set(r.restriction_group_id, (restrictionRuleCountByGroup.get(r.restriction_group_id) ?? 0) + 1)
  }
  const dealerCountByCatalog = new Map<string, number>()
  for (const c of companies ?? []) {
    if (c.catalog_id) {
      dealerCountByCatalog.set(c.catalog_id, (dealerCountByCatalog.get(c.catalog_id) ?? 0) + 1)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalogs</h1>
          <p className="text-muted-foreground">
            A Catalog defines what a dealer is allowed to buy.
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
                <TableHead>Availability</TableHead>
                <TableHead>Dealers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(catalogs ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No catalogs yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {(catalogs ?? []).map((catalog) => {
                const availRuleCount = catalog.restriction_group_id ? (restrictionRuleCountByGroup.get(catalog.restriction_group_id) ?? 0) : 0
                const dealerCount = dealerCountByCatalog.get(catalog.id) ?? 0
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
                      {catalog.restriction_group_id ? (
                        <span className="text-sm text-muted-foreground">
                          {availRuleCount} {availRuleCount === 1 ? 'rule' : 'rules'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not configured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {dealerCount === 0 ? 'Unassigned' : `${dealerCount} ${dealerCount === 1 ? 'dealer' : 'dealers'}`}
                      </span>
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
