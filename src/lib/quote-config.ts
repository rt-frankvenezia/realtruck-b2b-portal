export const QUOTE_SOURCE = {
  REALTRUCK: 'realtruck.com',
  LEER: 'leer.com',
} as const

export const QUOTE_BRAND = {
  ARE: 'ARE',
  LEER: 'LEER',
} as const

export const QUOTE_CONFIG_METHOD = {
  ARE_CONSUMER: 'are-consumer',
  LEER_FIBERGLASS: 'leer-fiberglass',
  LEER_ALUMINUM: 'leer-aluminum',
} as const

export const QUOTE_SOURCE_LABEL: Record<string, string> = {
  'realtruck.com': 'RealTruck.com',
  'leer.com': 'LEER.com',
}

export const QUOTE_BRAND_LABEL: Record<string, string> = {
  ARE: 'A.R.E.',
  LEER: 'LEER',
}

export const QUOTE_CONFIG_METHOD_LABEL: Record<string, string> = {
  'are-consumer': 'A.R.E. Configurator',
  'leer-fiberglass': 'LEER Fiberglass',
  'leer-aluminum': 'LEER Aluminum',
}

export type QuoteBrand = typeof QUOTE_BRAND[keyof typeof QUOTE_BRAND]
export type QuoteSource = typeof QUOTE_SOURCE[keyof typeof QUOTE_SOURCE]
export type QuoteConfigMethod = typeof QUOTE_CONFIG_METHOD[keyof typeof QUOTE_CONFIG_METHOD]
