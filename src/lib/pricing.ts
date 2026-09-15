// Client-side pricing utility — single source of truth for volume tier resolution.
// Used by the cart context (on quantity change), the PDP panel (live price preview),
// and any other component that needs to apply a tier schedule without an RPC call.

export type PricingTier = {
  minQty: number
  discountPercent: number
}

/** Returns the highest qualifying tier for the given quantity. */
export function resolveEffectiveTier(
  tiers: PricingTier[],
  quantity: number,
): PricingTier {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty)
  return sorted.find((t) => t.minQty <= quantity) ?? sorted[sorted.length - 1]
}

/** Returns the dealer price for a given map price, tier schedule, and quantity. */
export function resolveEffectivePrice(
  mapPrice: number,
  tiers: PricingTier[],
  quantity: number,
): number {
  const tier = resolveEffectiveTier(tiers, quantity)
  return mapPrice * (1 - tier.discountPercent / 100)
}
