import { existsSync, readFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { extname } from 'node:path'
import { HttpError } from './router.ts'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

/**
 * Serves the built web app (apps/web/dist). Known asset paths are served as
 * files, and a missing one is a 404 so a stale page fails loudly instead of
 * parsing HTML as a script. Every other path gets index.html, never cached,
 * so client-side routes work and a deploy is picked up on the next load.
 */
export function serveApp(distDir: URL, pathname: string, res: ServerResponse): void {
  if (!existsSync(distDir)) throw new HttpError(404, 'web app not built: run `npm run build`, or use the Vite dev server')
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  const type = TYPES[extname(rel)]
  if (type && type !== TYPES['.html'] && !rel.includes('..')) {
    const file = new URL(rel, distDir)
    if (existsSync(file)) {
      // Hashed build output never changes; the brand images keep their names, so they revalidate.
      const cache = rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
      res.writeHead(200, { 'content-type': type, 'cache-control': cache }).end(readFileSync(file))
      return
    }
    throw new HttpError(404, 'not found')
  }
  res.writeHead(200, { 'content-type': TYPES['.html']!, 'cache-control': 'no-cache' }).end(readFileSync(new URL('index.html', distDir)))
}
