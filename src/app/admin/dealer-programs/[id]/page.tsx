import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DealerProgramInfoForm } from '@/components/admin/DealerProgramInfoForm'
import { DealerProgramDealerAssignment } from '@/components/admin/DealerProgramDealerAssignment'

export default async function AdminDealerProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: program }, { data: catalogs }, { data: allCompanies }] = await Promise.all([
    supabase.from('dealer_programs').select('*').eq('id', id).maybeSingle(),
    supabase.from('catalogs').select('id, name').order('name'),
    supabase.from('companies').select('id, name, dealer_program_id').order('name'),
  ])

  if (!program) notFound()

  const assignedCompanies = (allCompanies ?? []).filter((c) => c.dealer_program_id === id)
  const otherCompanies = (allCompanies ?? []).filter((c) => c.dealer_program_id !== id)
  const assignedCatalog = (catalogs ?? []).find((c) => c.id === program.catalog_id) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/dealer-programs" className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to Dealer Programs
        </Link>
        <h1 className="text-2xl font-semibold">{program.name}</h1>
        {program.description && <p className="text-muted-foreground mt-1">{program.description}</p>}
      </div>

      {/* Program Information */}
      <Card>
        <CardHeader>
          <CardTitle>Program Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DealerProgramInfoForm program={program} catalogs={catalogs ?? []} />
        </CardContent>
      </Card>

      {/* Assigned Catalog summary */}
      {assignedCatalog && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{assignedCatalog.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dealers in this program receive pricing and availability as defined in this catalog.
                </p>
              </div>
              <Link href={`/admin/catalogs/${assignedCatalog.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  View Catalog →
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!assignedCatalog && (
        <Card>
          <CardHeader><CardTitle>Assigned Catalog</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No catalog assigned. Use the Program Information form above to assign one.{' '}
              {(catalogs ?? []).length === 0 && (
                <Link href="/admin/catalogs" className="text-primary hover:underline">
                  Create a Catalog first.
                </Link>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dealer assignment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dealers</CardTitle>
            <Badge variant="outline">{assignedCompanies.length} assigned</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DealerProgramDealerAssignment
            dealerProgramId={id}
            assignedCompanies={assignedCompanies}
            otherCompanies={otherCompanies}
          />
        </CardContent>
      </Card>
    </div>
  )
}
