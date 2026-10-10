/** Landing copy. It describes the product in general terms; numbers live on the benchmarks page. */
import {
  Building2,
  EyeOff,
  Fingerprint,
  Landmark,
  Link2,
  PhoneCall,
  ScanFace,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  UsersRound,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

/** Who the entry is made for, shown in the strip under the hero. */
export const BUILT_FOR = ['Shenzhen FinTechathon 2026', 'WeBank 微众银行', 'International Track · AI', 'Topic A · Personal Finance Assistant']

export const SHIFT_STATEMENT =
  'Modern scams no longer break into accounts. They call the real owner and talk them into paying. Every check passes, because the person pressing confirm is the customer.'

export interface Card {
  icon: LucideIcon
  title: string
  body: string
}

export const WHY_CONTROLS_MISS: Card[] = [
  {
    icon: Fingerprint,
    title: 'The login is genuine',
    body: 'Face, fingerprint and one-time codes all confirm the right person. The right person is being instructed.',
  },
  { icon: Smartphone, title: 'The device is trusted', body: 'The payment comes from the customer’s own phone, on their usual network, at their usual time.' },
  {
    icon: ScanFace,
    title: 'Warnings reach the caller too',
    body: 'The caller says a warning will appear and explains how to tap through it, before it appears.',
  },
]

export interface Step extends Card {
  key: string
  screen: 'call' | 'hold' | 'family' | 'record'
}

export const STEPS: Step[] = [
  {
    key: '01',
    icon: PhoneCall,
    screen: 'call',
    title: 'The phone notices the pressure',
    body: 'The banking app sees that a call or a screen share is live while a payment is made. The caller’s number stays private to the phone.',
  },
  {
    key: '02',
    icon: ShieldCheck,
    screen: 'hold',
    title: 'The risky payment waits',
    body: 'A new payee or an unusual amount during the call pauses the payment. Everyday payments go straight through.',
  },
  {
    key: '03',
    icon: UsersRound,
    screen: 'family',
    title: 'Someone outside the call decides',
    body: 'A person the customer chose in advance sees what happened, calls back on a known number, then releases or blocks.',
  },
  {
    key: '04',
    icon: Link2,
    screen: 'record',
    title: 'Everyone shares one record',
    body: 'The circle, its timelock and every decision sit on a ledger the bank, the operator and the regulator run together.',
  },
]

export interface Audience extends Card {
  eyebrow: string
  points: string[]
}

export const AUDIENCES: Audience[] = [
  {
    icon: UserRoundCheck,
    eyebrow: 'For customers',
    title: 'Pay as usual, protected when it counts',
    body: 'Nothing changes for everyday payments. Under pressure, the money waits, and the customer can always cancel.',
    points: ['No extra step for normal payments', 'Cancel any paused payment', 'An emergency PIN for coercion in person'],
  },
  {
    icon: UsersRound,
    eyebrow: 'For families',
    title: 'One tap, from your own phone',
    body: 'Trusted people see the facts the bank sees and decide in their own time, after they have spoken to the customer.',
    points: ['Call signals and answers in plain words', 'Veto any new “trusted person”', 'Every decision signed on your device'],
  },
  {
    icon: Landmark,
    eyebrow: 'For banks',
    title: 'Narrow holds, shared accountability',
    body: 'Hold only the pressured, risky payments, settle by a shared record, and learn from the operator without moving its data.',
    points: ['Federated score with the mobile operator', 'Release record shared with the regulator', 'A typed SDK and HTTP API'],
  },
]

export const PRINCIPLES: Card[] = [
  {
    icon: EyeOff,
    title: 'Data stays where it lives',
    body: 'Bank and operator train one model together. Each keeps its own records, and only encrypted values cross.',
  },
  { icon: Waypoints, title: 'No single gatekeeper', body: 'Bank, operator and regulator share the release record. None of them can rewrite it alone.' },
  { icon: ShieldCheck, title: 'Narrow by default', body: 'Only payments made during a live call or screen share, with a risky feature, ever wait.' },
  {
    icon: Building2,
    title: 'People decide, never a timer',
    body: 'A payment is released by a person. If the circle is silent, it goes to a reviewer at the bank.',
  },
]

export const SDK_SNIPPETS: { label: string; language: string; code: string }[] = [
  {
    label: 'Transfer',
    language: 'ts',
    code: `import { createClient } from '@kinsign/sdk'

const kinsign = createClient({ baseUrl: 'https://bank.example' })

const result = await kinsign.transfer({
  payee: 'Zhang Wei',
  amount: 50_000,
  channel: { onCall: true, callSeconds: 2400, callerSaved: false,
             screenCaptured: false, remoteControlApp: false },
})

result.action // 'hold'
result.reasons // ['on a call for 40 min', 'new payee', …]`,
  },
  {
    label: 'Decide',
    language: 'ts',
    code: `import { createDevice, createSigner } from '@kinsign/sdk'

// The key never leaves the trusted person's phone.
const device = createDevice({ key, config, rpcUrl })
const signer = createSigner(kinsign, device)

const outcome = await signer.block(hold)
outcome.state // 'Blocked': the money is back`,
  },
  {
    label: 'Contract',
    language: 'sol',
    code: `function release(bytes32 holdId, bytes32 transferDigest, bytes32 recordHash) external {
    Hold storage h = holds[holdId];
    if (h.state != State.Held) revert BadState();
    _requireCircle(h); // never the account holder
    if (transferDigest != h.transferDigest) revert DigestMismatch();
    _move(holdId, h, State.Released, recordHash);
}`,
  },
]
