import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ResourceIcon } from '@/components/dealer/ResourceIcon'
import { DownloadResourceButton } from '@/components/dealer/DownloadResourceButton'

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q, category } = await searchParams
  const supabase = await createClient()
  const { data: allResources } = await supabase.from('resources').select('*').order('created_at', { ascending: false })

  const categories = [...new Set((allResources ?? []).map((r) => r.category))].sort()
  const brandCount = new Set((allResources ?? []).map((r) => r.brand)).size
  const newCount = (allResources ?? []).filter((r) => r.is_new).length

  const filtered = (allResources ?? []).filter((r) => {
    if (category && r.category !== category) return false
    if (q && !`${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Resources & Sales Tools</h1>
        <p className="text-muted-foreground">Access installation guides, product catalogs, training materials, and sales resources.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Resources</CardDescription>
            <CardTitle className="text-3xl">{allResources?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Brands</CardDescription>
            <CardTitle className="text-3xl">{brandCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>New This Month</CardDescription>
            <CardTitle className="text-3xl">{newCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search resources by title, description, or tags..." className="max-w-xl" />
        {category && <input type="hidden" name="category" value={category} />}
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dealer/resources"
          className={`rounded-full px-3 py-1 text-sm ${!category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/dealer/resources?category=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1 text-sm ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {allResources?.length ?? 0} resources
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource) => (
          <Card key={resource.id} className="flex flex-col overflow-hidden">
            <div className="relative flex h-32 items-center justify-center bg-neutral-100">
              <ResourceIcon category={resource.category} size={40} className="text-neutral-400" />
              {resource.is_new && <Badge className="absolute right-3 top-3 bg-green-600 text-white">NEW</Badge>}
            </div>
            <CardContent className="flex flex-1 flex-col gap-3 pt-4">
              <div>
                <h3 className="font-semibold">{resource.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{resource.category}</Badge>
                <Badge variant="outline">{resource.brand}</Badge>
              </div>
              <DownloadResourceButton title={resource.title} />
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">No resources match your search.</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
