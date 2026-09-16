import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateDealerProgramDialog } from '@/components/admin/CreateDealerProgramDialog'

export default async function AdminDealerProgramsPage() {
  const supabase = await createClient()
  const [{ data: programs }, { data: catalogs }, { data: companies }] = await Promise.all([
    supabase.from('dealer_programs').select('*').order('name'),
    supabase.from('catalogs').select('id, name').order('name'),
    supabase.from('companies').select('dealer_program_id'),
  ])

  const dealerCountByProgram = new Map<string, number>()
  for (const c of companies ?? []) {
    if (c.dealer_program_id) {
      dealerCountByProgram.set(c.dealer_program_id, (dealerCountByProgram.get(c.dealer_program_id) ?? 0) + 1)
    }
  }
  const catalogById = new Map((catalogs ?? []).map((c) => [c.id, c]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dealer Programs</h1>
          <p className="text-muted-foreground">
            Dealer Programs group dealers into a commercial tier. Each program is assigned a Catalog that defines pricing and availability.
          </p>
        </div>
        <CreateDealerProgramDialog catalogs={catalogs ?? []} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Catalog</TableHead>
                <TableHead className="text-right">Dealers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(programs ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No dealer programs yet.
                  </TableCell>
                </TableRow>
              )}
              {(programs ?? []).map((program) => {
                const catalog = program.catalog_id ? catalogById.get(program.catalog_id) : null
                const dealerCount = dealerCountByProgram.get(program.id) ?? 0
                return (
                  <TableRow key={program.id}>
                    <TableCell>
                      <Link href={`/admin/dealer-programs/${program.id}`} className="font-medium hover:underline">
                        {program.name}
                      </Link>
                      {program.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{program.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {catalog ? (
                        <Link href={`/admin/catalogs/${catalog.id}`} className="text-sm hover:underline text-primary">
                          {catalog.name}
                        </Link>
                      ) : (
                        <Badge variant="outline" className="text-xs">No catalog assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{dealerCount}</TableCell>
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
