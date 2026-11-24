'use client'

import { useIsMobile } from '@/lib/use-mobile'

// troca um trecho da home no celular (o servidor renderiza a versão de desktop)
export function MobileSwitch({ mobile, desktop }: { mobile: React.ReactNode; desktop: React.ReactNode }) {
  return useIsMobile() ? mobile : desktop
}
