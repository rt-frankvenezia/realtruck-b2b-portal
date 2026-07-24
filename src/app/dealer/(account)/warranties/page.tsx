import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/status-labels'

export default async function DealerWarrantiesPage() {
  const supabase = await createClient()
  const { data: warranties } = await supabase
    .from('warranty_registrations')
    .select('*')
    .order('registration_date', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Warranty Registrations</h1>
        <p className="text-muted-foreground">Customers register warranties separately from the installation record.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(warranties ?? []).map((warranty) => (
                <TableRow key={warranty.id}>
                  <TableCell className="font-medium">{warranty.customer_name}</TableCell>
                  <TableCell>
                    {[warranty.vehicle_year, warranty.vehicle_make, warranty.vehicle_model].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell>{warranty.product_name ?? '—'}</TableCell>
                  <TableCell>{formatDate(warranty.registration_date)}</TableCell>
                </TableRow>
              ))}
              {(warranties ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No warranty registrations yet.
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
