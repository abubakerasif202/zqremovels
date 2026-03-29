import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export default function Button ({ variant = 'primary', className, children, ...rest }: Props) {
  const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition'
  const styles: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:opacity-90 rounded-soft shadow-sm',
    ghost: 'border border-espresso/20 text-espresso hover:border-espresso/50 rounded-soft'
  }

  return (
    <button className={clsx(base, styles[variant], className)} {...rest}>
      {children}
    </button>
  )
}
