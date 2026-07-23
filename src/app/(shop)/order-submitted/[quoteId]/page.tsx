import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function OrderSubmittedPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Thanks — your request is in!</CardTitle>
          <CardDescription>
            A dealer will reach out shortly to confirm pricing and schedule installation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">
            Reference: <span className="font-mono">{quoteId}</span>
          </p>
          <Button render={<Link href="/build" />}>Build another</Button>
        </CardContent>
      </Card>
    </div>
  )
}
