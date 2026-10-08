import type { IncomingMessage, ServerResponse } from 'node:http'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export type Handler = (body: unknown) => Promise<unknown>
type Method = 'GET' | 'POST'

const MAX_BODY_BYTES = 1_000_000

/** Minimal method + exact-path router. The API is small enough that patterns would be noise. */
export class Router {
  private readonly routes = new Map<string, Handler>()

  get(path: string, handler: () => Promise<unknown>): this {
    return this.on('GET', path, handler)
  }

  post(path: string, handler: Handler): this {
    return this.on('POST', path, handler)
  }

  /** Handles the request if a route matches; returns false otherwise. */
  async handle(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
    const handler = this.routes.get(`${req.method} ${pathname}`)
    if (!handler) return false
    const body = req.method === 'POST' ? parseJson(await readBody(req)) : undefined
    sendJson(res, 200, await handler(body))
    return true
  }

  private on(method: Method, path: string, handler: Handler): this {
    this.routes.set(`${method} ${path}`, handler)
    return this
  }
}

export async function readBody(req: IncomingMessage): Promise<string> {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'body too large')
  }
  return text
}

function parseJson(text: string): unknown {
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'body is not JSON')
  }
}

export function sendJson(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v)))
}
