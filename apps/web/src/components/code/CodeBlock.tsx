import { Check, Copy } from 'lucide-react'
import { Highlight } from 'prism-react-renderer'
import { useState, type ReactNode } from 'react'
import { codeTheme, languageOf } from './highlight'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard blocked: nothing to do
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  )
}

/** Highlighted code on ink, with a header for its title (or language) and a copy button. */
export default function CodeBlock({ code, language, title, header }: { code: string; language?: string; title?: string; header?: ReactNode }) {
  const lang = languageOf(language)
  const text = code.replace(/\n$/, '')
  return (
    <div className="overflow-hidden rounded-2xl bg-[#14161B] ring-1 ring-inset ring-white/[0.06]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-1.5 pl-4 pr-1.5">
        {header ?? <span className="font-mono text-[12px] text-white/45">{title ?? language ?? ''}</span>}
        <CopyButton text={text} />
      </div>
      <Highlight code={text} language={lang} theme={codeTheme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-[1.7]">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
