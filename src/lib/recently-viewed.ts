// Plain localStorage helpers, not a React Context — nothing needs live/
// reactive access to this list the way DealerCartContext's badge does.
// Written on product-detail mount (RecordRecentlyViewed), read once on
// homepage mount (RecentlyViewedSection).

const STORAGE_KEY = 'realtruck-dealer-recently-viewed'
const MAX_ITEMS = 8

export function recordRecentlyViewed(productId: string) {
  try {
    const ids = getRecentlyViewedIds().filter((id) => id !== productId)
    ids.unshift(productId)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)))
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

export function getRecentlyViewedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}
