// Plain localStorage helpers, not a React Context — nothing needs live/
// reactive access to this list the way DealerCartContext's badge does.
// Written on product-detail mount (RecordRecentlyViewed), read once on
// homepage mount (RecentlyViewedSection). Keyed per user id so different
// personas signed into the same browser don't share a history.

const STORAGE_PREFIX = 'realtruck-dealer-recently-viewed'
const MAX_ITEMS = 8

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function recordRecentlyViewed(userId: string, productId: string) {
  try {
    const ids = (getRecentlyViewedIds(userId) ?? []).filter((id) => id !== productId)
    ids.unshift(productId)
    window.localStorage.setItem(storageKey(userId), JSON.stringify(ids.slice(0, MAX_ITEMS)))
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

// Seeds a user's history directly (used to backfill a deterministic fake
// history on first visit) — from then on it behaves exactly like a real
// recorded list, since it lives under the same storage key.
export function seedRecentlyViewed(userId: string, productIds: string[]) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(productIds.slice(0, MAX_ITEMS)))
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

// null = this user has never had a history recorded or seeded yet, distinct
// from an empty array. Normal use (record only ever adds) can't produce a
// non-null empty array, so callers can treat null as "needs seeding."
export function getRecentlyViewedIds(userId: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (raw === null) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : null
  } catch {
    return null
  }
}
