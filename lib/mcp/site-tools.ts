import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import {
  upsertProject,
  upsertArticle,
  setLanguageShowOnHome,
  setLanguagesOrder,
  setContactLinksOrder,
  upsertSiteContent,
  getAllProjects,
  getAllArticles,
} from '@/lib/supabase/admin-queries'
import { getLanguages, getContactLinks, getSiteContent, mapProjectRow, PROJECT_SELECT, type ProjectRow } from '@/lib/supabase/queries'
import { reindexProject, reindexArticle, reindexLanguage, reindexSobreTexto } from '@/lib/supabase/search-index'
import { canRead, canWrite, MCP_RESOURCES, type McpPermissions } from './resources'
import { buildSiteTemplate, NAV_PAGES } from './site-template'

function textResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] }
}

/** Template geral, visibilidade e ordenação — o que cruza vários recursos. */
export function registerSiteTools(server: McpServer, permissions: McpPermissions, client: SupabaseClient): void {
  const hasAny = MCP_RESOURCES.some((r) => canRead(permissions, r) || canWrite(permissions, r))
  if (hasAny) {
    server.registerTool(
      'get_template_site',
      {
        title: 'Template do site',
        description: 'Guia geral: o que existe no site, qual tool edita cada coisa, chaves de conteúdo e como mostrar/esconder. Leia antes de editar.',
      },
      async () => textResult(buildSiteTemplate())
    )
    server.registerResource(
      'template-site',
      'template://site',
      { title: 'Template do site', description: 'Guia geral de edição do site e visibilidade', mimeType: 'text/markdown' },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: buildSiteTemplate() }] })
    )
  }

  const canHide = canWrite(permissions, 'projetos') || canWrite(permissions, 'artigos') || canWrite(permissions, 'tecnologias')
  if (canHide) {
    server.registerTool(
      'set_visibilidade',
      {
        title: 'Mostrar/esconder projeto, artigo ou tecnologia',
        description:
          'projeto: visible (aparece no site) e show_on_home (destaque na home); artigo: visible; tecnologia: show_on_home. Campos omitidos não mudam.',
        inputSchema: {
          entity: z.enum(['projeto', 'artigo', 'tecnologia']),
          id: z.string().uuid(),
          visible: z.boolean().optional(),
          show_on_home: z.boolean().optional(),
        },
      },
      async ({ entity, id, visible, show_on_home }) => {
        const need = entity === 'projeto' ? 'projetos' : entity === 'artigo' ? 'artigos' : 'tecnologias'
        if (!canWrite(permissions, need)) throw new Error(`sem permissão de escrita em ${need}`)
        if (entity === 'projeto') {
          await upsertProject({ id, ...(visible !== undefined && { visible }), ...(show_on_home !== undefined && { show_on_home }) }, client)
          const { data, error } = await client.from('projects').select(PROJECT_SELECT).eq('id', id).single()
          if (error) throw error
          const full = mapProjectRow(data as unknown as ProjectRow)
          await reindexProject(full, client)
          return textResult({ id, visible: full.visible, show_on_home: full.show_on_home })
        }
        if (entity === 'artigo') {
          if (visible === undefined) throw new Error('artigo só tem "visible"')
          const saved = await upsertArticle({ id, visible }, client)
          await reindexArticle(saved, client)
          return textResult({ id, visible: saved.visible })
        }
        if (show_on_home === undefined) throw new Error('tecnologia só tem "show_on_home"')
        await setLanguageShowOnHome(id, show_on_home, client)
        return textResult({ id, show_on_home })
      }
    )
  }

  if (canWrite(permissions, 'tecnologias')) {
    server.registerTool(
      'ordenar_tecnologias',
      {
        title: 'Ordenar tecnologias',
        description: 'Define a ordem de exibição: envie os ids das tecnologias (list_tecnologias) na ordem desejada.',
        inputSchema: { ordered_ids: z.array(z.string().uuid()) },
      },
      async ({ ordered_ids }) => {
        await setLanguagesOrder(ordered_ids, client)
        return textResult(await getLanguages(client))
      }
    )
  }

  if (canWrite(permissions, 'conteudo_site')) {
    server.registerTool(
      'set_visibilidade_site',
      {
        title: 'Mostrar/esconder páginas e recursos do site',
        description: `menu_oculto: páginas escondidas do menu (${NAV_PAGES.join(', ')}); a lista SUBSTITUI a atual. pagina_tecnologias: ativa/desativa /tecnologias. easter_eggs e mascote: ligam/desligam. Campos omitidos não mudam.`,
        inputSchema: {
          menu_oculto: z.array(z.enum(NAV_PAGES)).optional(),
          pagina_tecnologias: z.boolean().optional(),
          easter_eggs: z.boolean().optional(),
          mascote: z.boolean().optional(),
        },
      },
      async ({ menu_oculto, pagina_tecnologias, easter_eggs, mascote }) => {
        const flag = (v: boolean) => (v ? 'true' : 'false')
        const writes: Promise<void>[] = []
        if (menu_oculto) writes.push(upsertSiteContent('nav_hidden_links', menu_oculto.join(','), client))
        if (pagina_tecnologias !== undefined) writes.push(upsertSiteContent('tecnologias_ativo', flag(pagina_tecnologias), client))
        if (easter_eggs !== undefined) writes.push(upsertSiteContent('easter_eggs_ativo', flag(easter_eggs), client))
        if (mascote !== undefined) writes.push(upsertSiteContent('mascote_ativo', flag(mascote), client))
        await Promise.all(writes)
        return textResult({ menu_oculto, pagina_tecnologias, easter_eggs, mascote })
      }
    )
    server.registerTool(
      'reindexar_busca',
      {
        title: 'Reindexar a busca',
        description: 'Reconstrói o índice de busca de todos os projetos e artigos visíveis, tecnologias e do texto "sobre". Use depois de mudanças em massa. Retorna as contagens.',
      },
      async () => {
        const [projects, articles, languages, content] = await Promise.all([
          getAllProjects(client),
          getAllArticles(client),
          getLanguages(client),
          getSiteContent(client),
        ])
        await Promise.all([
          ...projects.filter((p) => p.visible).map((p) => reindexProject(p, client)),
          ...articles.filter((a) => a.visible).map((a) => reindexArticle(a, client)),
          ...languages.map((l) => reindexLanguage(l, client)),
        ])
        await reindexSobreTexto(content.sobre_texto ?? null, content.sobre_texto_en ?? null, client)
        return textResult({ projetos: projects.filter((p) => p.visible).length, artigos: articles.filter((a) => a.visible).length, tecnologias: languages.length })
      }
    )
    server.registerTool(
      'republicar_site',
      {
        title: 'Republicar o site',
        description: 'Invalida o cache público na hora (igual ao botão Republicar do admin). Normalmente desnecessário: toda escrita já faz isso.',
      },
      async () => {
        revalidateTag('site', { expire: 0 })
        const at = new Date().toISOString()
        await upsertSiteContent('last_republish_at', at, client)
        return textResult({ republished_at: at })
      }
    )
    server.registerTool(
      'ordenar_links_contato',
      {
        title: 'Ordenar links de contato',
        description: 'Envie os ids dos links (read_conteudo_site → _contact_links) na ordem desejada.',
        inputSchema: { ordered_ids: z.array(z.string().uuid()) },
      },
      async ({ ordered_ids }) => {
        await setContactLinksOrder(ordered_ids, client)
        return textResult(await getContactLinks(client))
      }
    )
  }
}
