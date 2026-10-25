export type CapPart = {
  part_no: string
  description: string
  category: string
  price: number
  image_url: string | null
  notes?: string
}

export type CapOption = {
  label: string
  value: string
}

export type CapRecord = {
  serial: string
  brand: 'LEER' | 'Century' | 'Snugtop'
  model: string
  color: string
  color_code: string
  truck_year: number
  truck_make: string
  truck_model: string
  bed_length: string
  manufactured_date: string
  warranty_expiration: string
  dealer: string
  options: CapOption[]
  parts: CapPart[]
}

const img = (partNo: string) =>
  `https://placehold.co/600x450/F5F5F5/AAAAAA?text=${encodeURIComponent(partNo)}`

export const SERIAL_LOOKUP: Record<string, CapRecord> = {
  '7421483': {
    serial: '7421483',
    brand: 'LEER',
    model: '100RCC',
    color: 'Oxford White',
    color_code: 'YZ',
    truck_year: 2024,
    truck_make: 'Ford',
    truck_model: 'F-150',
    bed_length: "5'7\"",
    manufactured_date: '2024-03-12',
    warranty_expiration: '2027-03-12',
    dealer: 'Big Sky Truck Outfitters',
    options: [
      { label: 'Front Window', value: 'Full Privacy Glass' },
      { label: 'Side Windows', value: 'Sliding · Privacy Tinted' },
      { label: 'Rear Door', value: 'Barn Door' },
      { label: 'Interior Lighting', value: 'Dome Light (12V)' },
      { label: 'Keyless Entry', value: 'No' },
      { label: 'Headliner', value: 'None' },
      { label: 'Roof Rack', value: 'None' },
      { label: 'Bulb Seal', value: 'Yes' },
      { label: 'Dynamic Pricing', value: 'Standard' },
      { label: 'Paint Match', value: 'Oxford White (YZ) — Factory OEM' },
    ],
    parts: [
      { part_no: 'LR-HW-412', description: 'Hood Latch Assembly', category: 'Latches & Hardware', price: 52.99, image_url: img('LR-HW-412'), notes: 'Includes mounting hardware' },
      { part_no: 'LR-HW-315', description: 'Rear Latch Set — Barn Door', category: 'Latches & Hardware', price: 67.50, image_url: img('LR-HW-315'), notes: 'Left and right included' },
      { part_no: 'LR-HW-204', description: 'Side Window Latch Set', category: 'Latches & Hardware', price: 38.99, image_url: img('LR-HW-204'), notes: 'Pair — driver and passenger' },
      { part_no: 'LR-SE-101', description: 'Full Perimeter Hood Seal', category: 'Seals & Weatherstrip', price: 89.99, image_url: img('LR-SE-101') },
      { part_no: 'LR-SE-312', description: 'Rear Barn Door Seal', category: 'Seals & Weatherstrip', price: 44.99, image_url: img('LR-SE-312') },
      { part_no: 'LR-SE-220', description: 'Side Window Seal Set', category: 'Seals & Weatherstrip', price: 34.99, image_url: img('LR-SE-220'), notes: 'Pair' },
      { part_no: 'LR-GL-106D', description: 'Side Glass — Driver Side', category: 'Glass & Windows', price: 285.00, image_url: img('LR-GL-106D'), notes: 'Tinted · 100RCC specific' },
      { part_no: 'LR-GL-106P', description: 'Side Glass — Passenger Side', category: 'Glass & Windows', price: 285.00, image_url: img('LR-GL-106P'), notes: 'Tinted · 100RCC specific' },
      { part_no: 'LR-HG-302', description: 'Rear Barn Door Hinge Set', category: 'Hinges & Props', price: 67.50, image_url: img('LR-HG-302'), notes: 'Pair · heavy-duty' },
      { part_no: 'LR-HG-110', description: 'Hood Strut / Prop Rod', category: 'Hinges & Props', price: 24.99, image_url: img('LR-HG-110') },
      { part_no: 'LR-LT-100', description: 'Dome Light Assembly', category: 'Lighting', price: 28.99, image_url: img('LR-LT-100') },
      { part_no: 'LR-VT-200', description: 'Rear Vent Assembly', category: 'Vents & Trim', price: 38.50, image_url: img('LR-VT-200') },
    ],
  },

  '6398201': {
    serial: '6398201',
    brand: 'Century',
    model: '100XQ Sport',
    color: 'Stone Gray',
    color_code: 'D3',
    truck_year: 2023,
    truck_make: 'Ram',
    truck_model: '1500',
    bed_length: "6'4\"",
    manufactured_date: '2023-09-08',
    warranty_expiration: '2026-09-08',
    dealer: 'Lone Star Cap & Bed',
    options: [
      { label: 'Front Window', value: 'Full Privacy Glass' },
      { label: 'Side Windows', value: 'Sliding · Bronze Tinted' },
      { label: 'Rear Door', value: 'Radius Door' },
      { label: 'Interior Lighting', value: 'Dome Light (12V)' },
      { label: 'Keyless Entry', value: 'Yes' },
      { label: 'Headliner', value: 'None' },
      { label: 'Roof Rack', value: 'None' },
      { label: 'Bulb Seal', value: 'Yes' },
      { label: 'Dynamic Pricing', value: 'Standard' },
      { label: 'Paint Match', value: 'Stone Gray (D3) — Factory OEM' },
    ],
    parts: [
      { part_no: 'CT-HW-401', description: 'Hood Latch Assembly', category: 'Latches & Hardware', price: 48.99, image_url: img('CT-HW-401') },
      { part_no: 'CT-HW-318', description: 'Rear Latch — Center Mount', category: 'Latches & Hardware', price: 55.00, image_url: img('CT-HW-318') },
      { part_no: 'CT-HW-210', description: 'Side Window Lock Set', category: 'Latches & Hardware', price: 36.50, image_url: img('CT-HW-210'), notes: 'Pair' },
      { part_no: 'CT-SE-101', description: 'Full Perimeter Hood Seal', category: 'Seals & Weatherstrip', price: 84.99, image_url: img('CT-SE-101') },
      { part_no: 'CT-SE-305', description: 'Rear Radius Door Seal', category: 'Seals & Weatherstrip', price: 42.99, image_url: img('CT-SE-305') },
      { part_no: 'CT-SE-218', description: 'Side Window Seal Set', category: 'Seals & Weatherstrip', price: 33.50, image_url: img('CT-SE-218'), notes: 'Pair' },
      { part_no: 'CT-GL-205D', description: 'Side Glass — Driver Side', category: 'Glass & Windows', price: 265.00, image_url: img('CT-GL-205D'), notes: 'Bronze tint · 100XQ Sport' },
      { part_no: 'CT-GL-205P', description: 'Side Glass — Passenger Side', category: 'Glass & Windows', price: 265.00, image_url: img('CT-GL-205P'), notes: 'Bronze tint · 100XQ Sport' },
      { part_no: 'CT-HG-301', description: 'Rear Radius Door Hinge Set', category: 'Hinges & Props', price: 58.50, image_url: img('CT-HG-301'), notes: 'Pair' },
      { part_no: 'CT-HG-108', description: 'Hood Prop Support', category: 'Hinges & Props', price: 22.99, image_url: img('CT-HG-108') },
      { part_no: 'CT-LT-100', description: 'Dome Light Assembly', category: 'Lighting', price: 26.99, image_url: img('CT-LT-100') },
      { part_no: 'CT-HW-500', description: 'Door Check Strap', category: 'Door Hardware', price: 18.99, image_url: img('CT-HW-500'), notes: 'Prevents over-extension' },
    ],
  },

  '8834715': {
    serial: '8834715',
    brand: 'Snugtop',
    model: 'Rebel',
    color: 'Black',
    color_code: 'BK',
    truck_year: 2024,
    truck_make: 'Chevrolet',
    truck_model: 'Silverado 1500',
    bed_length: "5'8\"",
    manufactured_date: '2024-01-22',
    warranty_expiration: '2027-01-22',
    dealer: 'Big Sky Truck Outfitters',
    options: [
      { label: 'Front Window', value: 'Privacy Glass' },
      { label: 'Side Windows', value: 'Slider · Privacy Tinted' },
      { label: 'Rear Door', value: 'Swing Door' },
      { label: 'Interior Lighting', value: 'LED Dome' },
      { label: 'Keyless Entry', value: 'No' },
      { label: 'Headliner', value: 'None' },
      { label: 'Roof Rack', value: 'None' },
      { label: 'Bulb Seal', value: 'Yes' },
      { label: 'Dynamic Pricing', value: 'Standard' },
      { label: 'Paint Match', value: 'Black (BK) — Factory OEM' },
    ],
    parts: [
      { part_no: 'ST-HW-408', description: 'Hood Latch — Chrome', category: 'Latches & Hardware', price: 58.99, image_url: img('ST-HW-408') },
      { part_no: 'ST-HW-322', description: 'Rear Door Latch Assembly', category: 'Latches & Hardware', price: 72.00, image_url: img('ST-HW-322'), notes: 'Includes T-handle' },
      { part_no: 'ST-HW-215', description: 'Side Window Lock Set', category: 'Latches & Hardware', price: 42.99, image_url: img('ST-HW-215'), notes: 'Pair' },
      { part_no: 'ST-SE-100', description: 'Hood Seal — Full Run', category: 'Seals & Weatherstrip', price: 92.50, image_url: img('ST-SE-100') },
      { part_no: 'ST-SE-308', description: 'Rear Door Seal', category: 'Seals & Weatherstrip', price: 48.99, image_url: img('ST-SE-308') },
      { part_no: 'ST-SE-215', description: 'Side Window Seal Set', category: 'Seals & Weatherstrip', price: 36.99, image_url: img('ST-SE-215'), notes: 'Pair' },
      { part_no: 'ST-SE-140', description: 'Tailgate Seal', category: 'Seals & Weatherstrip', price: 28.99, image_url: img('ST-SE-140') },
      { part_no: 'ST-GL-308D', description: 'Side Glass — Driver Side', category: 'Glass & Windows', price: 295.00, image_url: img('ST-GL-308D'), notes: 'Privacy tint · Rebel specific' },
      { part_no: 'ST-GL-308P', description: 'Side Glass — Passenger Side', category: 'Glass & Windows', price: 295.00, image_url: img('ST-GL-308P'), notes: 'Privacy tint · Rebel specific' },
      { part_no: 'ST-HG-305', description: 'Rear Door Hinge Set', category: 'Hinges & Props', price: 71.50, image_url: img('ST-HG-305'), notes: 'Heavy-duty · pair' },
      { part_no: 'ST-LT-105', description: 'LED Dome Light', category: 'Lighting', price: 32.99, image_url: img('ST-LT-105'), notes: 'LED upgrade' },
    ],
  },
}
