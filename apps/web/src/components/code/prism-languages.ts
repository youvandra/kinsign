/**
 * prism-react-renderer ships without Bash and Solidity. Prism's own grammar
 * files register themselves on a global `Prism`, so expose the bundled
 * instance first, then load them.
 */
import { Prism } from 'prism-react-renderer'
;(globalThis as { Prism?: typeof Prism }).Prism = Prism
await import('prismjs/components/prism-bash')
await import('prismjs/components/prism-solidity')
