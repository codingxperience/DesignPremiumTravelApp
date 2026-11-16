import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Cairo renders larger and taller than Archivo, so Arabic headings step down in size and open up their leading.
const SIZES = {
  '2xl': 'text-[38px] leading-[1.02] rtl:text-[34px] rtl:leading-[1.32]',
  xl: 'text-[31px] leading-[1.06] rtl:text-[28px] rtl:leading-[1.38]',
  lg: 'text-[25px] leading-[1.1] rtl:text-[23px] rtl:leading-[1.42]',
  md: 'text-[20px] leading-[1.16] rtl:text-[19px] rtl:leading-[1.45]',
  sm: 'text-[17px] leading-[1.22] rtl:text-[16px] rtl:leading-[1.5]',
}

type HeadingProps = {
  as?: ElementType
  size?: keyof typeof SIZES
  className?: string
  children: ReactNode
  id?: string
}

export function Heading({ as: Tag = 'h2', size = 'lg', className, children, id }: HeadingProps) {
  return (
    <Tag id={id} className={cn('heading', SIZES[size], className)}>
      {children}
    </Tag>
  )
}
