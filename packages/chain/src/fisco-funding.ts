/**
 * FISCO BCOS 3.16's web3 endpoint refuses any sender with zero native balance,
 * even at gas price 0 (bcos-rpc TxValidator::checkSenderBalance). This tops up
 * accounts through the FISCO console, which signs with the chain's
 * balance-governor account.
 */
import { execFileSync } from 'node:child_process'
import type { Hex } from '@kinsign/protocol'
import type { PublicClient } from 'viem'
import { repoPath } from './paths.ts'

/** The console needs Java 17. */
const JAVA_HOME = process.env.KINSIGN_JAVA_HOME ?? '/opt/homebrew/opt/openjdk@17'

export async function fundOnFisco(client: PublicClient, addresses: readonly Hex[]): Promise<void> {
  const missing: Hex[] = []
  for (const address of addresses) if ((await client.getBalance({ address })) === 0n) missing.push(address)
  if (missing.length === 0) return

  const script = missing.map((a) => `addBalance ${a} 10 ether`).join('\n') + '\nquit\n'
  const env = { ...process.env, JAVA_HOME, PATH: `${JAVA_HOME}/bin:${process.env.PATH}` }
  execFileSync('bash', ['start.sh'], {
    cwd: repoPath('infra/fisco/build/console/').pathname,
    input: script,
    env,
    stdio: ['pipe', 'ignore', 'inherit'],
    timeout: 600_000,
  })

  for (const address of missing) if ((await client.getBalance({ address })) === 0n) throw new Error(`${address} still unfunded`)
}
