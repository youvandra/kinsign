import { API } from '@kinsign/protocol'
import { describe, expect, it } from 'vitest'
import { ApiError, createClient } from '../src/client.ts'

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetch = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status })
  }) as typeof globalThis.fetch
  return { fetch, calls }
}

describe('createClient', () => {
  it('GETs from the base URL and returns the JSON', async () => {
    const { fetch, calls } = fakeFetch(200, { balance: 5 })
    const client = createClient({ baseUrl: 'https://bank.test', fetch })
    expect(await client.account()).toEqual({ balance: 5 })
    expect(calls[0]!.url).toBe(`https://bank.test${API.account}`)
    expect(calls[0]!.init.method).toBeUndefined()
  })

  it('POSTs a JSON body', async () => {
    const { fetch, calls } = fakeFetch(200, { ok: true })
    await createClient({ fetch }).interview('0x01', { toldToKeepSecret: true })
    expect(calls[0]!.init.method).toBe('POST')
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ holdId: '0x01', answers: { toldToKeepSecret: true } })
  })

  it('throws ApiError with the server reason and status', async () => {
    const { fetch } = fakeFetch(400, { error: 'unknown hold' })
    const err = await createClient({ fetch })
      .sync('0x02')
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ message: 'unknown hold', status: 400 })
  })

  it('reads the block number through the RPC proxy', async () => {
    const { fetch, calls } = fakeFetch(200, { jsonrpc: '2.0', id: 1, result: '0x2a' })
    expect(await createClient({ fetch }).blockNumber()).toBe(42)
    expect(calls[0]!.url).toBe(API.rpc)
  })
})
