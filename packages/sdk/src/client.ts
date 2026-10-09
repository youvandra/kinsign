/**
 * Typed client for the bank API. Paths and payloads come from
 * @kinsign/protocol, so the client and the server cannot drift apart.
 */
import {
  API,
  type AccountView,
  type AssistantView,
  type Category,
  type FinanceView,
  type ChannelState,
  type HoldSummary,
  type InterviewReading,
  type Lang,
  type ConfigView,
  type DemoLinks,
  type Hex,
  type HoldState,
  type HoldView,
  type InterviewAnswers,
  type ProposalsView,
  type TransferBody,
  type TransferResult,
  type TxResult,
} from '@kinsign/protocol'

export type RecordKind = 'release' | 'block' | 'cancel'

export interface ClientOptions {
  /** Origin of the bank API, e.g. `https://bank.example`. Empty means same origin. */
  baseUrl?: string
  /** A fetch implementation; defaults to the global one. */
  fetch?: typeof fetch
}

/** The API answered with an error status. `message` is the server's reason. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createClient({ baseUrl = '', fetch: doFetch = globalThis.fetch.bind(globalThis) }: ClientOptions = {}) {
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const init: RequestInit = body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
    const res = await doFetch(`${baseUrl}${path}`, init)
    const json = (await res.json()) as T & { error?: string }
    if (!res.ok) throw new ApiError(json.error ?? res.statusText, res.status)
    return json
  }

  return {
    /** Chain, contract address and ABI, and the enrolled customer's circle. */
    config: () => request<ConfigView>(API.config),
    account: () => request<AccountView>(API.account),
    holds: () => request<HoldView[]>(API.holds),
    proposals: () => request<ProposalsView>(API.proposals),

    /** Pays at once, or opens a hold when the transfer happens under pressure. */
    transfer: (body: TransferBody) => request<TransferResult>(API.transfer, body),
    /** Interview answers for a live hold. Only a "yes" is sent: answers can raise risk, never lower it. */
    interview: (holdId: Hex, answers: InterviewAnswers) => request<TxResult>(API.interview, { holdId, answers }),
    /** A salted decision record; its hash goes into the device's own transaction. */
    issueRecord: (holdId: Hex, kind: RecordKind, by: Hex) => request<{ recordHash: Hex }>(API.record, { holdId, kind, by }),
    /** Files the record by the transaction's receipt and settles the money by the contract's state. */
    sync: (holdId: Hex, recordHash?: Hex, txHash?: Hex) => request<{ state: HoldState }>(API.sync, { holdId, recordHash, txHash }),

    /** The customer's own words during a hold; the bank attests only the "yes" answers it reads. */
    interviewText: (holdId: Hex, text: string) => request<InterviewReading>(API.interviewText, { holdId, text }),
    /** The note a trusted person reads before deciding, in their language. Display text only. */
    holdSummary: (holdId: Hex, lang: Lang) => request<HoldSummary>(API.familySummary, { holdId, lang }),

    /** Monthly summary, bills, budgets and ranked recommendations, written in `lang`. */
    finance: {
      view: (lang: Lang) => request<FinanceView>(API.finance, { lang }),
      /** The customer's own budget for one everyday category; 0 removes it. */
      setBudget: (category: Category, limit: number, lang: Lang) => request<FinanceView>(API.financeBudget, { category, limit, lang }),
    },

    /** The payment assistant. It reads and drafts; a draft moves money only through `confirm`. */
    assistant: {
      mode: () => request<{ mode: AssistantView['mode'] }>(API.assistant),
      chat: (text: string, conversationId?: string) => request<AssistantView>(API.assistantChat, { text, conversationId }),
      /** The customer's tap on Confirm: the draft becomes a transfer under the same hold rule. */
      confirm: (conversationId: string, draftId: string, channel: ChannelState, duress = false) =>
        request<{ view: AssistantView; result: TransferResult }>(API.assistantConfirm, { conversationId, draftId, channel, duress }),
      dismiss: (conversationId: string, draftId: string) => request<AssistantView>(API.assistantDismiss, { conversationId, draftId }),
    },

    /** Current block, read through the API's RPC proxy. */
    async blockNumber(): Promise<number> {
      const { result } = await request<{ result: Hex }>(API.rpc, { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] })
      return Number.parseInt(result, 16)
    },

    /** Endpoints of the local demo server only. */
    demo: {
      links: () => request<DemoLinks>(API.links),
      escalate: (holdId: Hex) => request<TxResult>(API.escalate, { holdId }),
      review: (holdId: Hex, approve: boolean) => request<TxResult>(API.review, { holdId, approve }),
      warp: (hours: number) => request<{ ok: true }>(API.warp, { hours }),
    },
  }
}

export type KinsignClient = ReturnType<typeof createClient>
