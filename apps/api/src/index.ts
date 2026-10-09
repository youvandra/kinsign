/**
 * Kinsign bank API. Starts (or connects to) a chain, deploys the release
 * contract, and serves the HTTP API, the devices' RPC proxy and the web app.
 *
 * KINSIGN_RPC=http://127.0.0.1:8545 runs it on FISCO BCOS; otherwise it starts
 * its own anvil running the same contract bytecode.
 */
import { createServer } from 'node:http'
import { networkFromEnv } from '@kinsign/chain'
import { API } from '@kinsign/protocol'
import { openAssistant } from './assistant.ts'
import { Bank } from './bank.ts'
import { config } from './config.ts'
import { proxyRpc } from './http/rpc-proxy.ts'
import { HttpError, readBody, Router, sendJson } from './http/router.ts'
import { serveApp } from './http/static.ts'
import { assistantRoutes } from './routes/assistant.ts'
import { bankRoutes } from './routes/bank.ts'
import { demoRoutes } from './routes/demo.ts'
import { financeRoutes } from './routes/finance.ts'
import { recordRoutes } from './routes/records.ts'

const network = await networkFromEnv(config.anvilPort)
const bank = await Bank.open(network)

const router = new Router()
bankRoutes(router, bank)
recordRoutes(router, bank)
demoRoutes(router, bank)
financeRoutes(router, bank)
assistantRoutes(router, bank, openAssistant(bank))

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost')
  try {
    if (pathname === API.rpc && req.method === 'POST') return await proxyRpc(network.rpc, await readBody(req), res)
    if (await router.handle(req, res, pathname)) return
    if (req.method === 'GET') return serveApp(config.webDist, pathname, res)
    throw new HttpError(404, 'not found')
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400
    const message = (e as { shortMessage?: string; message?: string }).shortMessage ?? (e as Error).message ?? String(e)
    sendJson(res, status, { error: message })
  }
})

server.listen(config.port, () => {
  console.log(`Kinsign bank API on http://localhost:${config.port} · ${network.label} · release contract ${bank.chain.address} · assistant ${config.assistant}`)
})

const shutdown = () => {
  server.close()
  network.stop()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
