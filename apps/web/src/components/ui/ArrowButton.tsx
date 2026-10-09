import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router'
import RollText from './RollText'

type Variant = 'accent' | 'dark' | 'outline' | 'light'

const shell: Record<Variant, string> = {
  accent: 'bg-accent text-white hover:bg-accent-hover',
  dark: 'bg-ink text-white hover:bg-black',
  outline: 'bg-white text-ink ring-1 ring-inset ring-gray-300 hover:ring-ink',
  light: 'bg-white text-ink hover:bg-gray-100',
}
const knob: Record<Variant, string> = {
  accent: 'bg-white text-accent',
  dark: 'bg-white text-ink',
  outline: 'bg-ink text-white',
  light: 'bg-ink text-white',
}

interface Common {
  text: string
  variant?: Variant
  icon?: LucideIcon
  size?: 'md' | 'lg'
  block?: boolean
}

function Inner({ text, variant = 'accent', icon: Icon = ArrowRight, size = 'md' }: Common) {
  const k = size === 'lg' ? 'h-8 w-8' : 'h-7 w-7'
  return (
    <>
      <RollText text={text} />
      <span className={`flex ${k} shrink-0 items-center justify-center rounded-full ${knob[variant]}`}>
        <Icon size={16} className="transition-transform duration-500 ease-axion group-hover:-rotate-45 motion-reduce:transition-none" />
      </span>
    </>
  )
}

const base = (v: Variant, size: 'md' | 'lg', block?: boolean) =>
  `group inline-flex items-center justify-between gap-3 rounded-full py-2 pr-2 font-medium transition-[background-color,box-shadow,transform] duration-300 ease-axion active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${
    size === 'lg' ? 'pl-6 text-[14px]' : 'pl-5 text-[13px]'
  } ${block ? 'w-full' : ''} ${shell[v]}`

export function ArrowButton({ text, variant = 'accent', icon, size = 'md', block, className = '', ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${base(variant, size, block)} ${className}`} {...rest}>
      <Inner text={text} variant={variant} icon={icon} size={size} />
    </button>
  )
}

/** A link styled as an arrow button. `to` navigates inside the app; `href` leaves it. */
export function ArrowLink({
  text,
  variant = 'accent',
  icon,
  size = 'md',
  block,
  className = '',
  to,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) {
  const inner = <Inner text={text} variant={variant} icon={icon} size={size} />
  const cls = `${base(variant, size, block)} ${className}`
  return to ? (
    <Link to={to} className={cls} {...rest}>
      {inner}
    </Link>
  ) : (
    <a className={cls} {...rest}>
      {inner}
    </a>
  )
}

/** Plain pill for secondary actions. */
export function Pill({ className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`group inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-ink ring-1 ring-inset ring-gray-300 transition-[box-shadow,transform] duration-300 ease-axion hover:ring-ink active:scale-[0.98] disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
