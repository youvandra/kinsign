import { spawn, type ChildProcess } from 'node:child_process'

export interface Network {
  rpc: string
  chainId: number
  /** Only a local anvil can move time (needed for the review window and the 72-hour timelock). */
  canWarp: boolean
  label: string
  stop(): void
}

export const FISCO_CHAIN_ID = 20200
export const ANVIL_CHAIN_ID = 31337

async function waitForRpc(rpc: string, attempts = 50): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(rpc, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      })
      if (r.ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`no RPC at ${rpc}`)
}

/**
 * A local anvil running the same bytecode the FISCO chain runs: zero gas price,
 * pre-Shanghai EVM (FISCO BCOS 3.x has no PUSH0), and time travel.
 */
export async function startAnvil(port: number): Promise<Network> {
  const args = ['--port', String(port), '--silent', '--chain-id', String(ANVIL_CHAIN_ID), '--base-fee', '0', '--gas-price', '0', '--hardfork', 'paris']
  const child: ChildProcess = spawn('anvil', args, { stdio: 'ignore' })
  const rpc = `http://127.0.0.1:${port}`
  await waitForRpc(rpc)
  return { rpc, chainId: ANVIL_CHAIN_ID, canWarp: true, label: 'local anvil (same contract bytecode)', stop: () => child.kill() }
}

/** An already running FISCO BCOS node, reached through its web3 RPC. */
export function fisco(rpc: string): Network {
  return { rpc, chainId: FISCO_CHAIN_ID, canWarp: false, label: 'FISCO BCOS local', stop: () => {} }
}

/** KINSIGN_RPC selects FISCO BCOS; otherwise a fresh anvil on the given port. */
export async function networkFromEnv(anvilPort: number): Promise<Network> {
  const rpc = process.env.KINSIGN_RPC
  return rpc ? fisco(rpc) : startAnvil(anvilPort)
}
