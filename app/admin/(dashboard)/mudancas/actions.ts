'use server'

import { revalidatePath } from 'next/cache'
import { applyOp } from '@/lib/changes/apply'
import { createClient } from '@/lib/supabase/server'
import type { Change, ChangeOp } from '@/lib/changes/types'

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

/** Guarda a fila atual como rascunho do usuário: é o que o preview do site mostra aplicado por cima do conteúdo. */
export async function savePreviewDraft(changes: Change[]): Promise<void> {
  if (!Array.isArray(changes) || JSON.stringify(changes).length > 900_000) return
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  await supabase.from('preview_drafts').upsert({ user_id: auth.user.id, changes, updated_at: new Date().toISOString() })
}
