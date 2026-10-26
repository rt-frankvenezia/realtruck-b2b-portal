export const QUOTE_SOURCE = {
  REALTRUCK: 'realtruck.com',
  LEER: 'leer.com',
} as const

export const QUOTE_BRAND = {
  ARE: 'ARE',
  LEER: 'LEER',
  CENTURY: 'Century',
  SNUGTOP: 'Snugtop',
} as const

export const QUOTE_CONFIG_METHOD = {
  ARE_CONSUMER: 'are-consumer',
  LEER_FIBERGLASS: 'leer-fiberglass',
  LEER_ALUMINUM: 'leer-aluminum',
  CENTURY_FIBERGLASS: 'century-fiberglass',
  CENTURY_ALUMINUM: 'century-aluminum',
  SNUGTOP_FIBERGLASS: 'snugtop-fiberglass',
  SNUGTOP_ALUMINUM: 'snugtop-aluminum',
} as const

export const QUOTE_SOURCE_LABEL: Record<string, string> = {
  'realtruck.com': 'RealTruck.com',
  'leer.com': 'LEER.com',
}

export const QUOTE_BRAND_LABEL: Record<string, string> = {
  ARE: 'A.R.E.',
  LEER: 'LEER',
  Century: 'Century',
  Snugtop: 'Snugtop',
}

export const QUOTE_CONFIG_METHOD_LABEL: Record<string, string> = {
  'are-consumer': 'A.R.E. Configurator',
  'leer-fiberglass': 'LEER Fiberglass',
  'leer-aluminum': 'LEER Aluminum',
  'century-fiberglass': 'Century Fiberglass',
  'century-aluminum': 'Century Aluminum',
  'snugtop-fiberglass': 'Snugtop Fiberglass',
  'snugtop-aluminum': 'Snugtop Aluminum',
}

// Config methods that route through the ACC external order portal
export const ACC_CONFIG_METHODS = new Set([
  'leer-aluminum',
  'century-aluminum',
  'snugtop-aluminum',
])

// Config methods that go through the portal wholesale order flow
export const FIBERGLASS_CONFIG_METHODS = new Set([
  'leer-fiberglass',
  'century-fiberglass',
  'snugtop-fiberglass',
])

export type QuoteBrand = typeof QUOTE_BRAND[keyof typeof QUOTE_BRAND]
export type QuoteSource = typeof QUOTE_SOURCE[keyof typeof QUOTE_SOURCE]
export type QuoteConfigMethod = typeof QUOTE_CONFIG_METHOD[keyof typeof QUOTE_CONFIG_METHOD]
