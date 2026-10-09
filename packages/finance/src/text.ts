/** Words and sentences for insights, in the three languages the apps speak. */
import type { Category, Lang } from '@kinsign/protocol'

export const money = (n: number): string => `¥${Math.round(n).toLocaleString('en-US')}`
const pct = (x: number): string => `${Math.round(x * 100)}%`

const CATEGORY: Record<Lang, Record<Category, string>> = {
  en: {
    income: 'Income',
    housing: 'Housing',
    utilities: 'Utilities',
    phone: 'Phone',
    groceries: 'Groceries',
    health: 'Health',
    education: 'Education',
    family: 'Family',
    dining: 'Dining out',
    transport: 'Transport',
    savings: 'Savings',
    other: 'Other',
  },
  zh: {
    income: '收入',
    housing: '住房',
    utilities: '水电燃气',
    phone: '话费',
    groceries: '买菜日用',
    health: '医疗',
    education: '教育',
    family: '家人',
    dining: '餐饮',
    transport: '交通',
    savings: '储蓄',
    other: '其他',
  },
  id: {
    income: 'Pemasukan',
    housing: 'Rumah',
    utilities: 'Listrik & air',
    phone: 'Pulsa',
    groceries: 'Belanja harian',
    health: 'Kesehatan',
    education: 'Pendidikan',
    family: 'Keluarga',
    dining: 'Makan di luar',
    transport: 'Transportasi',
    savings: 'Tabungan',
    other: 'Lainnya',
  },
}

export const categoryName = (c: Category, lang: Lang): string => CATEGORY[lang][c]

export function shortDate(at: number, lang: Lang): string {
  const d = new Date(at)
  const day = d.getUTCDate()
  const m = d.getUTCMonth()
  if (lang === 'zh') return `${m + 1}月${day}日`
  const names = lang === 'id' ? 'Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des' : 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'
  const name = names.split(' ')[m]
  return lang === 'id' ? `${day} ${name}` : `${name} ${day}`
}

type T = { title: string; detail: string }

export const TEXT: Record<
  Lang,
  {
    billIncrease(payee: string, change: number, last: number, average: number): T
    duplicateCharge(payee: string, amount: number, dates: string[]): T
    budgetPace(category: string, spent: number, limit: number, projected: number, over: boolean): T
    categoryJump(category: string, projected: number, average: number, limit: number): T
    saveSurplus(kept: number, amount: number): T
    setBudget(category: string, average: number, limit: number): T
    savingsNote: string
  }
> = {
  en: {
    billIncrease: (p, c, l, a) => ({
      title: `${p} is up ${pct(c)}`,
      detail: `${money(l)} this month against an average of ${money(a)}. Worth checking the reading or the tariff before the next bill.`,
    }),
    duplicateCharge: (p, a, d) => ({ title: `${p} charged you twice`, detail: `${money(a)} on ${d.join(' and ')}. Ask ${p} to refund the extra charge.` }),
    budgetPace: (c, s, l, p, over) => ({
      title: over ? `${c} is over budget` : `${c} is heading over budget`,
      detail: over
        ? `${money(s)} spent against a budget of ${money(l)}.`
        : `${money(s)} spent of ${money(l)}, on pace for ${money(p)} by the end of the month.`,
    }),
    categoryJump: (c, p, a, l) => ({
      title: `${c} is running high`,
      detail: `On pace for ${money(p)} this month against ${money(a)} usually. A budget of ${money(l)} would flag it early.`,
    }),
    saveSurplus: (k, a) => ({
      title: `You kept ${money(k)} last month`,
      detail: `Move ${money(a)} of it to your savings account? Nothing moves until you confirm.`,
    }),
    setBudget: (c, a, l) => ({
      title: `Set a budget for ${c.toLowerCase()}`,
      detail: `You spend about ${money(a)} a month. A budget of ${money(l)} lets me warn you before you pass it.`,
    }),
    savingsNote: 'Monthly savings',
  },
  zh: {
    billIncrease: (p, c, l, a) => ({ title: `${p}上涨了${pct(c)}`, detail: `本月${money(l)}，平时平均${money(a)}。建议在下次缴费前核对读数或资费。` }),
    duplicateCharge: (p, a, d) => ({ title: `${p}重复扣费`, detail: `${d.join('和')}各扣了${money(a)}。可以联系${p}退回多扣的一笔。` }),
    budgetPace: (c, s, l, p, over) => ({
      title: over ? `${c}已超出预算` : `${c}可能超出预算`,
      detail: over ? `已花${money(s)}，预算${money(l)}。` : `已花${money(s)}，预算${money(l)}，按目前速度月底将达${money(p)}。`,
    }),
    categoryJump: (c, p, a, l) => ({ title: `${c}支出偏高`, detail: `本月预计${money(p)}，平时约${money(a)}。设定${money(l)}的预算可以提前提醒您。` }),
    saveSurplus: (k, a) => ({ title: `上个月结余${money(k)}`, detail: `要把其中${money(a)}转入储蓄账户吗？您确认之前不会转出任何钱。` }),
    setBudget: (c, a, l) => ({ title: `为${c}设定预算`, detail: `您每月大约花${money(a)}。设定${money(l)}的预算后，快超出时我会提醒您。` }),
    savingsNote: '每月储蓄',
  },
  id: {
    billIncrease: (p, c, l, a) => ({
      title: `${p} naik ${pct(c)}`,
      detail: `${money(l)} bulan ini, biasanya rata-rata ${money(a)}. Cek meteran atau tarifnya sebelum tagihan berikutnya.`,
    }),
    duplicateCharge: (p, a, d) => ({
      title: `${p} menagih dua kali`,
      detail: `${money(a)} pada ${d.join(' dan ')}. Minta ${p} mengembalikan tagihan yang dobel.`,
    }),
    budgetPace: (c, s, l, p, over) => ({
      title: over ? `${c} melewati anggaran` : `${c} akan melewati anggaran`,
      detail: over
        ? `${money(s)} terpakai dari anggaran ${money(l)}.`
        : `${money(s)} terpakai dari ${money(l)}, dengan laju ini jadi ${money(p)} di akhir bulan.`,
    }),
    categoryJump: (c, p, a, l) => ({
      title: `${c} lebih tinggi dari biasa`,
      detail: `Diperkirakan ${money(p)} bulan ini, biasanya ${money(a)}. Anggaran ${money(l)} bisa memberi peringatan lebih awal.`,
    }),
    saveSurplus: (k, a) => ({
      title: `Bulan lalu tersisa ${money(k)}`,
      detail: `Pindahkan ${money(a)} ke rekening tabungan? Tidak ada uang yang pindah sebelum Anda konfirmasi.`,
    }),
    setBudget: (c, a, l) => ({
      title: `Buat anggaran ${c.toLowerCase()}`,
      detail: `Pengeluaran Anda sekitar ${money(a)} sebulan. Dengan anggaran ${money(l)}, saya bisa mengingatkan sebelum terlewati.`,
    }),
    savingsNote: 'Tabungan bulanan',
  },
}
