import { HOLD_STATES, type Hex, type HoldState, type TxResult } from '@kinsign/protocol'
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  decodeErrorResult,
  decodeEventLog,
  defineChain,
  http,
  type Abi,
  type Chain,
  type PublicClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { loadArtifact, RELEASE_CONTRACT, type Artifact } from './artifact.ts'
import type { Network } from './network.ts'

const GAS_LIMIT = 400_000n
/** 100 ETH: anvil accounts are topped up to this. */
const ANVIL_FUNDING = '0x56BC75E2D63100000'

export interface HoldRecord {
  holder: Hex
  openedAt: bigint
  state: HoldState
  decidedBy: Hex
  transferDigest: Hex
  chain: Hex
}

export interface CircleEntry {
  effectiveAt: number
  removedAt: number
}

export interface MemberProposal {
  member: Hex
  effectiveAt: number
}

/**
 * Client for the KinsignRelease contract. Every write is simulated first to
 * name the revert, then sent as a real transaction either way, so a refused
 * action leaves a failed receipt on chain and not just a client-side error.
 */
export class ReleaseClient {
  readonly chain: Chain
  readonly pub: PublicClient
  private readonly artifact: Artifact
  address: Hex = '0x0000000000000000000000000000000000000000'
  txCount = 0
  failedTxCount = 0

  constructor(readonly network: Network) {
    this.artifact = loadArtifact(RELEASE_CONTRACT)
    this.chain = defineChain({
      id: network.chainId,
      name: network.label,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [network.rpc] } },
    })
    this.pub = createPublicClient({ chain: this.chain, transport: http(), pollingInterval: 100 })
  }

  get abi(): Abi {
    return this.artifact.abi
  }

  async deploy(operatorKey: Hex, reviewer: Hex, responseWindowSeconds: bigint): Promise<Hex> {
    const wallet = this.wallet(operatorKey)
    const hash = await wallet.deployContract({
      abi: this.abi,
      bytecode: this.artifact.bytecode,
      args: [wallet.account.address, reviewer, responseWindowSeconds],
      gasPrice: 0n,
    })
    const receipt = await this.pub.waitForTransactionReceipt({ hash })
    if (!receipt.contractAddress) throw new Error('deploy failed')
    this.address = receipt.contractAddress
    this.txCount++
    return this.address
  }

  async send(key: Hex, functionName: string, args: readonly unknown[]): Promise<TxResult> {
    const wallet = this.wallet(key)
    let reason: string | undefined
    try {
      await this.pub.simulateContract({ address: this.address, abi: this.abi, functionName, args, account: wallet.account })
    } catch (e) {
      reason = this.revertName(e)
    }
    const hash = await wallet.writeContract({ address: this.address, abi: this.abi, functionName, args, gas: GAS_LIMIT, gasPrice: 0n })
    const receipt = await this.pub.waitForTransactionReceipt({ hash })
    this.txCount++
    const ok = receipt.status === 'success'
    if (!ok) this.failedTxCount++
    if (ok && reason) throw new Error(`${functionName} simulated a revert (${reason}) but landed`)
    return { ok, error: ok ? undefined : (reason ?? 'reverted'), hash }
  }

  async hold(holdId: Hex): Promise<HoldRecord> {
    const [holder, openedAt, state, decidedBy, transferDigest, chain] = (await this.read('holds', [holdId])) as [Hex, bigint, number, Hex, Hex, Hex]
    return { holder, openedAt, state: HOLD_STATES[state] ?? 'None', decidedBy, transferDigest, chain }
  }

  async circle(holder: Hex, member: Hex): Promise<CircleEntry> {
    const [effectiveAt, removedAt] = (await this.read('circle', [holder, member])) as [bigint, bigint]
    return { effectiveAt: Number(effectiveAt), removedAt: Number(removedAt) }
  }

  async now(): Promise<number> {
    return Number((await this.pub.getBlock()).timestamp)
  }

  /** Every MemberProposed event for a holder, latest proposal per member. */
  async proposals(holder: Hex): Promise<MemberProposal[]> {
    const logs = await this.pub.getLogs({ address: this.address, fromBlock: 0n })
    const latest = new Map<Hex, MemberProposal>()
    for (const log of logs) {
      try {
        const ev = decodeEventLog({ abi: this.abi, data: log.data, topics: log.topics })
        const args = ev.args as unknown as { holder?: Hex; member?: Hex; effectiveAt?: bigint }
        if (ev.eventName !== 'MemberProposed' || args.holder !== holder || !args.member) continue
        latest.set(args.member, { member: args.member, effectiveAt: Number(args.effectiveAt) })
      } catch {
        // not one of ours
      }
    }
    return [...latest.values()]
  }

  /** Anvil only: move chain time forward and mine a block. */
  async warp(seconds: number): Promise<void> {
    if (!this.network.canWarp) throw new Error('this chain cannot move time')
    await this.rpc('evm_increaseTime', [seconds])
    await this.rpc('evm_mine', [])
  }

  /** Anvil only; FISCO accounts are funded through its console (fisco-funding.ts). */
  async fund(address: Hex): Promise<void> {
    if (this.network.canWarp) await this.rpc('anvil_setBalance', [address, ANVIL_FUNDING])
  }

  private wallet(key: Hex) {
    return createWalletClient({ account: privateKeyToAccount(key), chain: this.chain, transport: http() })
  }

  private read(functionName: string, args: readonly unknown[]) {
    return this.pub.readContract({ address: this.address, abi: this.abi, functionName, args })
  }

  private rpc(method: string, params: unknown[]) {
    return this.pub.request({ method, params } as never)
  }

  private revertName(e: unknown): string {
    if (!(e instanceof BaseError)) return 'reverted'
    const reverted = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
    if (reverted?.data?.errorName) return reverted.data.errorName
    const data = (e.walk((x) => typeof (x as { data?: unknown }).data === 'string') as { data?: Hex } | null)?.data
    if (data) {
      try {
        return decodeErrorResult({ abi: this.abi, data }).errorName
      } catch {
        // unknown error selector
      }
    }
    return 'reverted'
  }
}
