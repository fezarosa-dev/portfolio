import { createClient } from '@/lib/supabase/server'
import type { Change } from './types'

/** Rascunho (fila de mudanças) do usuário logado; vazio se não houver ou der erro. */
export async function readDraft(): Promise<Change[]> {
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []
    const { data, error } = await supabase.from('preview_drafts').select('changes').eq('user_id', auth.user.id).maybeSingle()
    if (error || !data || !Array.isArray(data.changes)) return []
    return data.changes as Change[]
  } catch {
    return []
  }
}
