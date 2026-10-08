import type { ServerResponse } from 'node:http'
import { sendJson } from './router.ts'

/** What a browser device needs to simulate, sign and follow its own transactions. */
const ALLOWED = new Set([
  'eth_chainId',
  'net_version',
  'eth_blockNumber',
  'eth_getBlockByNumber',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getCode',
  'eth_getTransactionCount',
  'eth_sendRawTransaction',
  'eth_getTransactionReceipt',
  'eth_getTransactionByHash',
])

interface RpcCall {
  id?: unknown
  method?: unknown
}

/**
 * Forwards JSON-RPC from devices to the chain. Anything outside the list gets
 * a standard "method not found", so clients fall back cleanly instead of failing.
 */
export async function proxyRpc(rpcUrl: string, rawBody: string, res: ServerResponse): Promise<void> {
  const body = JSON.parse(rawBody) as RpcCall | RpcCall[]
  const calls = Array.isArray(body) ? body : [body]
  const refused = calls.find((c) => typeof c.method !== 'string' || !ALLOWED.has(c.method))
  if (refused) {
    const notFound = (c: RpcCall) => ({
      jsonrpc: '2.0',
      id: c.id ?? null,
      error: { code: -32601, message: `method ${String(c.method)} is not available through this proxy` },
    })
    sendJson(res, 200, Array.isArray(body) ? calls.map(notFound) : notFound(body))
    return
  }
  const upstream = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rawBody })
  res.writeHead(200, { 'content-type': 'application/json' }).end(await upstream.text())
}
