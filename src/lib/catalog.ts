// Phase 7: a static product catalog. The Phase 1 schema deliberately has
// no products table — quotes/installations store cap_model/cap_color/msrp
// as plain values, not catalog references (per the roadmap, catalog
// management was out of scope). This is enough to drive a real builder →
// quote flow without inventing a catalog subsystem the roadmap never asked
// for.

export type CapModel = {
  id: string
  name: string
  description: string
  msrp: number
  colors: string[]
  finishes: string[]
}

export const CAP_MODELS: CapModel[] = [
  {
    id: 'ls2',
    name: 'LS-II Series',
    description: 'Low-profile fiberglass cap with a clean, factory-matched look.',
    msrp: 1899,
    colors: ['Oxford White', 'Diamond Black', 'Magnetic Gray'],
    finishes: ['Matte', 'Gloss'],
  },
  {
    id: 'z-series',
    name: 'Z-Series',
    description: 'Mid-rise cap with extra interior headroom and cargo access.',
    msrp: 2099,
    colors: ['Summit White', 'Onyx Black', 'Billet Silver'],
    finishes: ['Gloss', 'Matte'],
  },
  {
    id: 'mx-series',
    name: 'MX-Series',
    description: 'High-rise cap built for gear haulers — max interior volume.',
    msrp: 2299,
    colors: ['Iconic Silver', 'Diamond Black', 'Billet Silver'],
    finishes: ['Matte'],
  },
]

export type CapOption = {
  id: string
  name: string
  price: number
}

export const CAP_OPTIONS: CapOption[] = [
  { id: 'led-kit', name: 'LED Interior Lighting Kit', price: 89 },
  { id: 'carpet-kit', name: 'Interior Carpet Kit', price: 249 },
  { id: 'roof-rack', name: 'Roof Rack Cross Bars', price: 179 },
]

export function findCapModel(id: string): CapModel | undefined {
  return CAP_MODELS.find((m) => m.id === id)
}
