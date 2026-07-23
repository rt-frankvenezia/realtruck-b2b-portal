import { Wrench, BookOpen, GraduationCap, Code2, DollarSign, Presentation, Headphones, Megaphone, Award, FileText } from 'lucide-react'

const CATEGORY_ICON: Record<string, typeof Wrench> = {
  'Installation Guides': Wrench,
  'Product Catalogs': BookOpen,
  'Training Materials': GraduationCap,
  'Technical Documents': Code2,
  Pricing: DollarSign,
  'Sales Tools': Presentation,
  'Support Documents': Headphones,
  'Marketing Materials': Megaphone,
  Programs: Award,
}

export function ResourceIcon({ category, size = 24, className }: { category: string; size?: number; className?: string }) {
  const Icon = CATEGORY_ICON[category] ?? FileText
  return <Icon size={size} className={className} strokeWidth={1.5} />
}
