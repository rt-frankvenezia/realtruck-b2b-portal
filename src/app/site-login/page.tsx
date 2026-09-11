// Deliberately plain, unbranded styling — no RealTruck logo/colors here.
// This gate exists precisely so this prototype never gets mistaken for a
// real RealTruck property; the entry page should look like a generic
// internal tool, not the app it's protecting.
export default async function SiteLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        action="/api/site-login"
        method="POST"
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-300 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Prototype Access</h1>
          <p className="mt-1 text-sm text-neutral-500">
            This is an internal, unofficial prototype — not a production RealTruck site.
          </p>
        </div>
        <input type="hidden" name="next" value={next ?? '/'} />
        <input
          type="password"
          name="password"
          placeholder="Access password"
          required
          autoFocus
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-400"
        />
        {error && <p className="text-sm text-red-600">Incorrect password.</p>}
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          Enter
        </button>
      </form>
    </div>
  )
}
