'use server'

import { revalidatePath } from 'next/cache'
import { applyOp } from '@/lib/changes/apply'
import type { ChangeOp } from '@/lib/changes/types'

// Autorização: mesmo padrão das demais ações do admin — o client por cookie + RLS só deixa gravar quem está logado.
// Sem updateTag('site') de propósito: o site público pega a mudança no ciclo de 60s do cache.
export async function applyChange(op: ChangeOp): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await applyOp(op)
    revalidatePath('/admin/tecnologias')
    revalidatePath('/admin/projetos')
    revalidatePath('/admin/artigos')
    revalidatePath('/admin/curriculo')
    revalidatePath('/admin/autores')
    revalidatePath('/admin/empresas')
    revalidatePath('/admin/contato')
    revalidatePath('/admin/personalizacao')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Não deu pra aplicar a mudança.' }
  }
}
