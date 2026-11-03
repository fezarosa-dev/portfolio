import type { SupabaseClient } from '@supabase/supabase-js'
import { homeWarning } from '@/lib/home-servers'

/** Aviso da home (HOME_SERVERS projetos) depois de mexer em projetos pelo MCP; null quando está tudo certo. */
export async function homeWarningFor(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.from('projects').select('visible, show_on_home')
  if (error) throw error
  return homeWarning(data)
}
