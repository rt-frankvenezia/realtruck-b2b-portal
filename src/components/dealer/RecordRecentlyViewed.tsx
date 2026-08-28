'use client'

import { useEffect } from 'react'
import { recordRecentlyViewed } from '@/lib/recently-viewed'

// Renders nothing — mounted on the product detail page (a server
// component) purely to write to localStorage on view. No-ops for
// anonymous visitors (userId undefined) since Recently Viewed never
// surfaces to them anyway.
export function RecordRecentlyViewed({ userId, productId }: { userId?: string; productId: string }) {
  useEffect(() => {
    if (!userId) return
    recordRecentlyViewed(userId, productId)
  }, [userId, productId])
  return null
}
