import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

// The bank API runs on 8620; the app proxies its API and the chain RPC so
// device keys sign in the browser against the same origin.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path('./src'),
      // The docs pages and the benchmark results are read from the repository at build time.
      '@docs': path('../../docs'),
      '@results': path('../../bench/results'),
    },
  },
  // The landing's WebGL shader library is large by itself; it is loaded only on the pages that use it.
  build: { chunkSizeWarningLimit: 3000, target: 'es2022' },
  server: {
    port: 5190,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8620',
      '/rpc': 'http://localhost:8620',
    },
  },
})
