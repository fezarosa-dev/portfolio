'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { setHandoff } from '@/lib/handoff'

// <Link> que grava `handoff` (chave + valor) antes de navegar, pra página de destino ler sem query string.
export function HandoffLink({
  handoff,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { handoff: [key: string, value: unknown] }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        setHandoff(...handoff)
        onClick?.(e)
      }}
    />
  )
}
