/**
 * A device: one person's key, signing contract calls on the device itself.
 * The bank never holds a customer's or a circle member's key, so it cannot
 * make a family decision on their behalf.
 */
import type { ConfigView, Hex, TxResult } from '@kinsign/protocol'
import { BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, decodeErrorResult, defineChain, http, type Abi } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export interface DeviceOptions {
  key: Hex
  /** From `client.config()`: chain id, contract address and ABI. */
  config: Pick<ConfigView, 'chainId' | 'contract' | 'abi'>
  /** JSON-RPC endpoint of the chain, usually the bank API's `/rpc` proxy. */
  rpcUrl: string
  gasLimit?: bigint
}

export interface Device {
  address: Hex
  /** Sends a contract call. A refused call is still sent, so the refusal is on chain. */
  send(functionName: string, args: readonly unknown[]): Promise<TxResult & { hash: Hex }>
}

const DEFAULT_GAS_LIMIT = 400_000n

export const generateKey = (): Hex => generatePrivateKey()

/**
 * The custom error a reverted call carries, e.g. `NotMember`. FISCO BCOS
 * returns the revert data raw in `error.data`, so it is decoded with the ABI.
 */
export function revertName(e: unknown, abi?: Abi): string {
  if (!(e instanceof BaseError)) return 'reverted'
  const reverted = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
  if (reverted?.data?.errorName) return reverted.data.errorName
  const data = (e.walk((x) => typeof (x as { data?: unknown }).data === 'string') as { data?: Hex } | null)?.data
  if (abi && data?.startsWith('0x')) {
    try {
      return decodeErrorResult({ abi, data }).errorName
    } catch {
      // unknown error selector
    }
  }
  return 'reverted'
}

export function createDevice({ key, config, rpcUrl, gasLimit = DEFAULT_GAS_LIMIT }: DeviceOptions): Device {
  const chain = defineChain({
    id: config.chainId,
    name: 'kinsign',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  })
  const account = privateKeyToAccount(key)
  const abi = config.abi as Abi
  const pub = createPublicClient({ chain, transport: http(), pollingInterval: 300 })
  const wallet = createWalletClient({ account, chain, transport: http() })

  return {
    address: account.address,
    async send(functionName, args) {
      let reason: string | undefined
      try {
        await pub.simulateContract({ address: config.contract, abi, functionName, args, account })
      } catch (e) {
        reason = revertName(e, abi)
      }
      const hash = await wallet.writeContract({ address: config.contract, abi, functionName, args, gas: gasLimit, gasPrice: 0n })
      const receipt = await pub.waitForTransactionReceipt({ hash })
      const ok = receipt.status === 'success'
      return { ok, error: ok ? undefined : (reason ?? 'reverted'), hash }
    },
  }
}
