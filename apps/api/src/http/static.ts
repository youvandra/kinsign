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
 * files; every other path gets index.html so client-side routes work.
 */
export function serveApp(distDir: URL, pathname: string, res: ServerResponse): void {
  if (!existsSync(distDir)) throw new HttpError(404, 'web app not built: run `npm run build`, or use the Vite dev server')
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  const type = TYPES[extname(rel)]
  if (type && type !== TYPES['.html'] && !rel.includes('..')) {
    const file = new URL(rel, distDir)
    if (existsSync(file)) {
      res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' }).end(readFileSync(file))
      return
    }
  }
  res.writeHead(200, { 'content-type': TYPES['.html']! }).end(readFileSync(new URL('index.html', distDir)))
}
