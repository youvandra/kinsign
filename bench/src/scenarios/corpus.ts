import type { ChannelState, InterviewAnswers } from '@kinsign/protocol'

export type Lang = 'zh' | 'id' | 'en'
export const LANGS: Lang[] = ['zh', 'id', 'en']

export type Step =
  | { do: 'holderRelease'; expect: 'NotMember' }
  | { do: 'holderProposesAccomplice' }
  | { do: 'holderRemovesMember' }
  | { do: 'accompliceRelease'; expect: 'NotMember' }
  | { do: 'memberBlock' }
  | { do: 'memberRelease' }
  | { do: 'holderCancel' }
  | { do: 'warp'; seconds: number }
  | { do: 'escalate' }
  | { do: 'debrief'; note: string }
  | { do: 'reviewer'; approve: boolean }

export interface Scenario {
  id: string
  kind: 'scam' | 'legit'
  typology: string
  lang: Lang
  variant: string
  callerScript?: string
  payee: string
  amount: number
  channel: ChannelState
  duress?: boolean
  interview?: InterviewAnswers
  steps: Step[]
  /** Final hold state, or "paid" when the policy pays at once. */
  expect: 'paid' | 'Released' | 'Blocked' | 'Cancelled'
  /** Steps that use time travel cannot run on FISCO. */
  needsWarp: boolean
}

const call = (min: number, extra: Partial<ChannelState> = {}): ChannelState => ({
  onCall: true,
  callSeconds: min * 60,
  callerSaved: false,
  screenCaptured: false,
  remoteControlApp: false,
  ...extra,
})
const noCall: ChannelState = { onCall: false, callSeconds: 0, callerSaved: false, screenCaptured: false, remoteControlApp: false }

/** What the caller says, one line per typology and language. Used by the agent evaluation; the policy never reads it. */
const SCRIPTS: Record<string, Record<Lang, string>> = {
  authority: {
    zh: '我是公安局的，你的账户涉嫌洗钱，必须把资金转到安全账户核查，不要告诉任何人。',
    id: 'Saya dari kepolisian, rekening Ibu terkait kasus pencucian uang. Pindahkan dana ke rekening aman untuk verifikasi, jangan bilang siapa-siapa.',
    en: 'This is the police. Your account is linked to money laundering. Move the funds to a safe account for verification and tell no one.',
  },
  kin: {
    zh: '阿姨，你儿子出车祸了，现在在医院，要马上交押金。',
    id: 'Bu, anak Ibu kecelakaan, sekarang di rumah sakit, harus bayar deposit sekarang juga.',
    en: 'Your son has been in an accident and is in hospital. The deposit has to be paid right now.',
  },
  refund: {
    zh: '您的订单出了问题，我们给您退款，请打开屏幕共享按我说的操作。',
    id: 'Pesanan Anda bermasalah, kami akan refund. Silakan bagikan layar dan ikuti langkah saya.',
    en: 'There is a problem with your order. We will refund you. Please share your screen and follow my steps.',
  },
  investment: {
    zh: '这个项目保本高收益，名额今天截止，先转到这个账户锁定。',
    id: 'Investasi ini dijamin untung besar, kuotanya tutup hari ini. Transfer ke rekening ini dulu untuk mengunci.',
    en: 'This investment is guaranteed, the window closes today. Transfer to this account now to lock in your place.',
  },
  takeover: {
    zh: '您的手机中了病毒，请安装这个软件，让技术人员远程帮您处理。',
    id: 'HP Anda kena virus. Pasang aplikasi ini supaya teknisi kami bisa memperbaikinya dari jarak jauh.',
    en: 'Your phone has a virus. Install this app so our technician can fix it remotely.',
  },
}

const TYPOLOGIES: { name: string; amount: number; channel: ChannelState }[] = [
  { name: 'authority', amount: 50_000, channel: call(40) },
  { name: 'kin', amount: 20_000, channel: call(8) },
  { name: 'refund', amount: 8_000, channel: call(25, { screenCaptured: true }) },
  { name: 'investment', amount: 30_000, channel: call(15) },
  { name: 'takeover', amount: 15_000, channel: call(20, { screenCaptured: true, remoteControlApp: true }) },
]

/** The coached victim's answers: whatever the caller says, which is "no" to everything. */
const COACHED: InterviewAnswers = { askedBySomeoneOnCall: false, toldToKeepSecret: false, promisedReturnOrThreatened: false }

const SCAM_VARIANTS: { name: string; steps: Step[]; expect: Scenario['expect']; duress?: boolean; warp: boolean }[] = [
  {
    name: 'circle blocks',
    steps: [{ do: 'holderRelease', expect: 'NotMember' }, { do: 'memberBlock' }],
    expect: 'Blocked',
    warp: false,
  },
  {
    name: 'caller adds a colleague',
    steps: [
      { do: 'holderProposesAccomplice' },
      { do: 'warp', seconds: 3600 },
      { do: 'accompliceRelease', expect: 'NotMember' },
      { do: 'holderRelease', expect: 'NotMember' },
      { do: 'memberBlock' },
    ],
    expect: 'Blocked',
    warp: true,
  },
  {
    name: 'circle unreachable, review after the call',
    steps: [
      { do: 'holderRelease', expect: 'NotMember' },
      { do: 'warp', seconds: 31 * 60 },
      { do: 'escalate' },
      { do: 'debrief', note: 'after the call the customer said the caller claimed to be police and asked for secrecy' },
      { do: 'reviewer', approve: false },
    ],
    expect: 'Blocked',
    warp: true,
  },
  {
    name: 'caller has the victim remove the son',
    steps: [{ do: 'holderRemovesMember' }, { do: 'holderRelease', expect: 'NotMember' }, { do: 'memberBlock' }],
    expect: 'Blocked',
    warp: false,
  },
  {
    name: 'victim types the duress PIN',
    steps: [{ do: 'holderRelease', expect: 'NotMember' }, { do: 'memberBlock' }],
    expect: 'Blocked',
    duress: true,
    warp: false,
  },
]

export function scamScenarios(): Scenario[] {
  const out: Scenario[] = []
  for (const t of TYPOLOGIES)
    for (const lang of LANGS)
      for (const v of SCAM_VARIANTS)
        out.push({
          id: `scam/${t.name}/${lang}/${v.name}`,
          kind: 'scam',
          typology: t.name,
          lang,
          variant: v.name,
          callerScript: SCRIPTS[t.name][lang],
          payee: `mule:${t.name}:${lang}`,
          amount: t.amount,
          channel: t.channel,
          duress: v.duress,
          interview: COACHED,
          steps: v.steps,
          expect: v.expect,
          needsWarp: v.warp,
        })
  return out
}

/** Legitimate cases, including the ones that make friction visible. Known payees: "electric", "school". */
const LEGIT: Omit<Scenario, 'id' | 'lang' | 'kind'>[] = [
  { typology: 'bill', variant: 'known payee during a call', payee: 'electric', amount: 300, channel: call(12), steps: [], expect: 'paid', needsWarp: false },
  {
    typology: 'tuition',
    variant: 'known school, call with daughter',
    payee: 'school',
    amount: 3_000,
    channel: call(10, { callerSaved: true }),
    steps: [],
    expect: 'paid',
    needsWarp: false,
  },
  { typology: 'new payee', variant: 'new payee, no call', payee: 'new-shop', amount: 900, channel: noCall, steps: [], expect: 'paid', needsWarp: false },
  {
    typology: 'large',
    variant: 'large amount to known payee, no call',
    payee: 'school',
    amount: 15_000,
    channel: noCall,
    steps: [],
    expect: 'paid',
    needsWarp: false,
  },
  {
    typology: 'landlord',
    variant: 'deposit to a new landlord who is on the line',
    payee: 'landlord',
    amount: 6_000,
    channel: call(6),
    steps: [{ do: 'warp', seconds: 300 }, { do: 'memberRelease' }],
    expect: 'Released',
    needsWarp: true,
  },
  {
    typology: 'hospital',
    variant: 'relative really in hospital, call with a saved contact',
    payee: 'hospital',
    amount: 12_000,
    channel: call(5, { callerSaved: true }),
    steps: [{ do: 'memberRelease' }],
    expect: 'Released',
    needsWarp: false,
  },
  {
    typology: 'review',
    variant: 'new payee on a call, circle unreachable, released after call-back',
    payee: 'contractor',
    amount: 4_000,
    channel: call(9),
    steps: [
      { do: 'warp', seconds: 31 * 60 },
      { do: 'escalate' },
      { do: 'debrief', note: 'customer confirmed by call-back that the contractor is real' },
      { do: 'reviewer', approve: true },
    ],
    expect: 'Released',
    needsWarp: true,
  },
  {
    typology: 'change of mind',
    variant: 'held, customer cancels',
    payee: 'car-seller',
    amount: 7_000,
    channel: call(4),
    steps: [{ do: 'holderCancel' }],
    expect: 'Cancelled',
    needsWarp: false,
  },
]

export function legitScenarios(): Scenario[] {
  return LEGIT.flatMap((l) => LANGS.map((lang) => ({ ...l, id: `legit/${l.typology}/${lang}`, kind: 'legit' as const, lang, payee: `${l.payee}` })))
}
