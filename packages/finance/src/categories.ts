import type { Category } from '@kinsign/protocol'

/** Payee words that name a category. The first match wins; anything else is "other". */
const RULES: [RegExp, Category][] = [
  [/pension|salary|wage|support from|养老金|工资|gaji|pensiun/i, 'income'],
  [/savings|储蓄|tabungan/i, 'savings'],
  [/property|rent|landlord|物业|房租|sewa/i, 'housing'],
  [/electric|water|gas|state grid|电费|水费|燃气|listrik|\bpln\b|pdam/i, 'utilities'],
  [/china mobile|china unicom|telecom|mobile plan|话费|pulsa|telkomsel/i, 'phone'],
  [/supermarket|market|hema|grocery|菜|超市|pasar|indomaret|alfamart/i, 'groceries'],
  [/pharmacy|hospital|clinic|medical|药|医院|apotek|rumah sakit/i, 'health'],
  [/school|tuition|学费|学校|sekolah|kuliah/i, 'education'],
  [/grandson|granddaughter|son|daughter|wei|孙|儿子|女儿|cucu|anak/i, 'family'],
  [/restaurant|tea house|cafe|dim sum|餐|茶楼|restoran|warung/i, 'dining'],
  [/metro|bus|taxi|didi|地铁|公交|ojek|gojek|grab/i, 'transport'],
]

export function categorize(payee: string, direction: 'in' | 'out' = 'out'): Category {
  if (direction === 'in') return 'income'
  for (const [re, category] of RULES) if (re.test(payee) && category !== 'income') return category
  return 'other'
}
