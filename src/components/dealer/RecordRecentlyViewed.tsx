'use client'

import { useEffect } from 'react'
import { recordRecentlyViewed } from '@/lib/recently-viewed'

// Renders nothing — mounted on the product detail page (a server
// component) purely to write to localStorage on view.
export function RecordRecentlyViewed({ productId }: { productId: string }) {
  useEffect(() => {
    recordRecentlyViewed(productId)
  }, [productId])
  return null
}
