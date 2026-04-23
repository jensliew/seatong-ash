import petronasLogo from '../assets/offtake-partners/petronas-logo.jpg'
import miscLogo from '../assets/offtake-partners/MISC-logo.jpg'
import unileverLogo from '../assets/offtake-partners/unilever-logo.jpg'
import nestleLogo from '../assets/offtake-partners/Nestlé-logo.png'

export interface ImpactStats {
  litres_filtered: number
  plastic_items: number
  microplastics: number
  fish_saved: number
  credits_earned: number
  credits_currency: 'MYR'
  credit_value_myr: number
  period_label: string
  last_updated_iso: string
}

export const impactStats: ImpactStats = {
  litres_filtered: 8_642_120,
  plastic_items: 12_430,
  microplastics: 38_917,
  fish_saved: 4,
  credits_earned: 2_430,
  credits_currency: 'MYR',
  credit_value_myr: 12_150,
  period_label: 'Last 30 days · Port Klang pilot',
  last_updated_iso: new Date().toISOString(),
}

export const topPlasticCategories: Array<{
  key: string
  label: string
  percent: number
  items: number
}> = [
  { key: 'soft_wrappers', label: 'Soft plastic wrappers', percent: 28, items: 3_480 },
  { key: 'cigarette_butts', label: 'Cigarette butts', percent: 21, items: 2_610 },
  { key: 'plastic_bottles', label: 'PET bottles', percent: 18, items: 2_237 },
  { key: 'straws', label: 'Straws & stirrers', percent: 12, items: 1_492 },
  { key: 'aluminium_cans', label: 'Aluminium cans', percent: 9, items: 1_119 },
  { key: 'fishing_debris', label: 'Fishing debris', percent: 7, items: 870 },
  { key: 'other', label: 'Other', percent: 5, items: 622 },
]

export const offtakePartners: Array<{
  name: string
  status: 'contracted' | 'pending' | 'interested'
  tonnes: number
  logoSrc: string
}> = [
  { name: 'PETRONAS Dagangan', status: 'contracted', tonnes: 48, logoSrc: petronasLogo },
  { name: 'MISC Berhad', status: 'pending', tonnes: 32, logoSrc: miscLogo },
  { name: 'Unilever Malaysia', status: 'pending', tonnes: 24, logoSrc: unileverLogo },
  { name: 'Nestlé Malaysia', status: 'interested', tonnes: 18, logoSrc: nestleLogo },
]
