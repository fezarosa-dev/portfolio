import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getLanguages, getAuthors, getCompanies, getResume, getResumeLinks, getContactLinks, getSiteContent } from '@/lib/supabase/queries'
import {
  getAllProjects,
  upsertProject,
  deleteProject,
  setProjectLanguages,
  setProjectAuthors,
  addCompany,
  updateCompany,
  deleteCompany,
  getAllArticles,
  upsertArticle,
  deleteArticle,
  addLanguage,
  updateLanguage,
  deleteLanguage,
  addAuthor,
  updateAuthor,
  deleteAuthor,
  upsertResume,
  addResumeLink,
  updateResumeLink,
  deleteResumeLink,
  upsertSiteContent,
  deleteSiteContentKey,
  addContactLink,
  updateContactLink,
  deleteContactLink,
} from '@/lib/supabase/admin-queries'
import { reindexProject, reindexArticle, reindexLanguage, reindexResume } from '@/lib/supabase/search-index'
import { mapProjectRow, PROJECT_SELECT, type ProjectRow } from '@/lib/supabase/queries'
import { canRead, canWrite, type McpPermissions } from './resources'

function textResult(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return { content: [{ type: 'text' as const, text }] }
}

async function reloadProject(id: string, client: SupabaseClient) {
  const { data, error } = await client.from('projects').select(PROJECT_SELECT).eq('id', id).single()
  if (error) throw error
  return mapProjectRow(data as unknown as ProjectRow)
}

/** Registra só as tools permitidas pra essa conexão — o resto nem aparece pro cliente MCP. */
export function registerMcpTools(server: McpServer, permissions: McpPermissions, client: SupabaseClient): void {
  // --- projetos (inclui empresas e vínculos) ---
  if (canRead(permissions, 'projetos')) {
    server.registerTool(
      'list_projetos',
      { title: 'Listar projetos', description: 'Lista todos os projetos do portfólio, incluindo os ocultos.' },
      async () => textResult(await getAllProjects(client))
    )
    server.registerTool(
      'list_empresas',
      { title: 'Listar empresas', description: 'Lista as empresas cadastradas, usadas como vínculo dos projetos.' },
      async () => textResult(await getCompanies(client))
    )
  }
  if (canWrite(permissions, 'projetos')) {
    server.registerTool(
      'upsert_projeto',
      {
        title: 'Criar ou editar projeto',
        description: 'Cria um projeto novo (sem "id") ou edita um existente (com "id"). Campos omitidos não são alterados numa edição.',
        inputSchema: {
          id: z.string().uuid().optional().describe('Omitir para criar um projeto novo'),
          title: z.string().optional(),
          title_en: z.string().optional(),
          summary: z.string().optional(),
          summary_en: z.string().optional(),
          content_md: z.string().optional().describe('Corpo do projeto em Markdown, português'),
          content_md_en: z.string().optional().describe('Corpo do projeto em Markdown, inglês'),
          repo_url: z.string().optional(),
          site_url: z.string().optional(),
          click_mode: z.enum(['detail', 'link']).optional(),
          click_url: z.string().optional(),
          visible: z.boolean().optional(),
          show_on_home: z.boolean().optional(),
          company_id: z.string().uuid().nullable().optional(),
          language_ids: z.array(z.string().uuid()).optional().describe('Substitui as tecnologias vinculadas ao projeto'),
          author_ids: z.array(z.string().uuid()).optional().describe('Substitui os autores vinculados ao projeto'),
        },
      },
      async ({ language_ids, author_ids, ...input }) => {
        const saved = await upsertProject(input, client)
        if (language_ids) await setProjectLanguages(saved.id, language_ids, client)
        if (author_ids) await setProjectAuthors(saved.id, author_ids, client)
        const full = await reloadProject(saved.id, client)
        await reindexProject(full, client)
        return textResult(full)
      }
    )
    server.registerTool(
      'delete_projeto',
      { title: 'Excluir projeto', description: 'Remove um projeto permanentemente.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteProject(id, client)
        return textResult({ deleted: id })
      }
    )
    server.registerTool(
      'upsert_empresa',
      {
        title: 'Criar ou editar empresa',
        description: 'Cria uma empresa nova (sem "id") ou edita uma existente (com "id").',
        inputSchema: {
          id: z.string().uuid().optional(),
          name: z.string().nullable().optional(),
          name_en: z.string().nullable().optional(),
          url: z.string().nullable().optional(),
        },
      },
      async ({ id, name = null, name_en = null, url = null }) => {
        const company = id
          ? await updateCompany(id, name, name_en, url, client)
          : await addCompany(name, name_en, url, client)
        return textResult(company)
      }
    )
    server.registerTool(
      'delete_empresa',
      { title: 'Excluir empresa', description: 'Remove uma empresa.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteCompany(id, client)
        return textResult({ deleted: id })
      }
    )
  }

  // --- artigos ---
  if (canRead(permissions, 'artigos')) {
    server.registerTool(
      'list_artigos',
      { title: 'Listar artigos', description: 'Lista todos os artigos, incluindo os ocultos.' },
      async () => textResult(await getAllArticles(client))
    )
  }
  if (canWrite(permissions, 'artigos')) {
    server.registerTool(
      'upsert_artigo',
      {
        title: 'Criar ou editar artigo',
        description: 'Cria um artigo novo (sem "id") ou edita um existente (com "id"). Campos omitidos não são alterados numa edição.',
        inputSchema: {
          id: z.string().uuid().optional(),
          title: z.string().optional(),
          title_en: z.string().optional(),
          summary: z.string().optional(),
          summary_en: z.string().optional(),
          content_md: z.string().optional(),
          content_md_en: z.string().optional(),
          visible: z.boolean().optional(),
        },
      },
      async (input) => {
        const saved = await upsertArticle(input, client)
        await reindexArticle(saved, client)
        return textResult(saved)
      }
    )
    server.registerTool(
      'delete_artigo',
      { title: 'Excluir artigo', description: 'Remove um artigo permanentemente.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteArticle(id, client)
        return textResult({ deleted: id })
      }
    )
  }

  // --- tecnologias ---
  if (canRead(permissions, 'tecnologias')) {
    server.registerTool(
      'list_tecnologias',
      { title: 'Listar tecnologias', description: 'Lista as tecnologias cadastradas.' },
      async () => textResult(await getLanguages(client))
    )
  }
  if (canWrite(permissions, 'tecnologias')) {
    server.registerTool(
      'upsert_tecnologia',
      {
        title: 'Criar ou editar tecnologia',
        description:
          'Cria uma tecnologia nova (sem "id") ou renomeia uma existente (com "id"). O ícone é resolvido automaticamente pelo nome (devicon), a menos que "icon_url" seja informado.',
        inputSchema: { id: z.string().uuid().optional(), name: z.string(), icon_url: z.string().optional() },
      },
      async ({ id, name, icon_url }) => {
        const saved = id ? await updateLanguage(id, name, icon_url, client) : await addLanguage(name, icon_url, client)
        await reindexLanguage(saved, client)
        return textResult(saved)
      }
    )
    server.registerTool(
      'delete_tecnologia',
      { title: 'Excluir tecnologia', description: 'Remove uma tecnologia.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteLanguage(id, client)
        return textResult({ deleted: id })
      }
    )
  }

  // --- autores ---
  if (canRead(permissions, 'autores')) {
    server.registerTool(
      'list_autores',
      { title: 'Listar autores', description: 'Lista as pessoas cadastradas como autoras/colaboradoras de projetos.' },
      async () => textResult(await getAuthors(client))
    )
  }
  if (canWrite(permissions, 'autores')) {
    server.registerTool(
      'upsert_autor',
      {
        title: 'Criar ou editar autor',
        description: 'Cria um autor novo (sem "id") ou edita um existente (com "id").',
        inputSchema: { id: z.string().uuid().optional(), name: z.string(), url: z.string().nullable().optional() },
      },
      async ({ id, name, url = null }) => {
        const author = id ? await updateAuthor(id, name, url, client) : await addAuthor(name, url, client)
        return textResult(author)
      }
    )
    server.registerTool(
      'delete_autor',
      { title: 'Excluir autor', description: 'Remove um autor.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteAuthor(id, client)
        return textResult({ deleted: id })
      }
    )
  }

  // --- currículo (e seus links) ---
  if (canRead(permissions, 'curriculo')) {
    server.registerTool(
      'read_curriculo',
      { title: 'Ler currículo', description: 'Retorna o conteúdo em Markdown do currículo (PT/EN) e seus links.' },
      async () => textResult({ ...(await getResume(client)), links: await getResumeLinks(client) })
    )
  }
  if (canWrite(permissions, 'curriculo')) {
    server.registerTool(
      'update_curriculo',
      {
        title: 'Atualizar currículo',
        description: 'Substitui o conteúdo em Markdown do currículo. Campos omitidos apagam o texto correspondente.',
        inputSchema: { content_md: z.string().nullable().optional(), content_md_en: z.string().nullable().optional() },
      },
      async ({ content_md = null, content_md_en = null }) => {
        await upsertResume(content_md, content_md_en, client)
        await reindexResume(content_md, content_md_en, client)
        return textResult({ content_md, content_md_en })
      }
    )
    server.registerTool(
      'upsert_link_curriculo',
      {
        title: 'Criar ou editar link do currículo',
        inputSchema: {
          id: z.string().uuid().optional(),
          label: z.string().nullable().optional(),
          label_en: z.string().nullable().optional(),
          url: z.string(),
        },
      },
      async ({ id, label = null, label_en = null, url }) => {
        const link = id ? await updateResumeLink(id, label, label_en, url, client) : await addResumeLink(label, label_en, url, client)
        return textResult(link)
      }
    )
    server.registerTool(
      'delete_link_curriculo',
      { title: 'Excluir link do currículo', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteResumeLink(id, client)
        return textResult({ deleted: id })
      }
    )
  }

  // --- conteúdo do site (textos, SEO, personalização, links de contato) ---
  if (canRead(permissions, 'conteudo_site')) {
    server.registerTool(
      'read_conteudo_site',
      {
        title: 'Ler conteúdo do site',
        description:
          'Retorna todos os pares chave/valor de configuração e texto do site (SEO por página, personalização, páginas legais, "sobre mim" etc.) e os links de contato.',
      },
      async () => textResult({ ...(await getSiteContent(client)), _contact_links: await getContactLinks(client) })
    )
  }
  if (canWrite(permissions, 'conteudo_site')) {
    server.registerTool(
      'set_conteudo_site',
      {
        title: 'Definir texto/config do site',
        description:
          'Define o valor de uma chave de conteúdo do site (ex.: "seo_home_title", "sobre_texto_pt", "search_rate_limit_max"). Use read_conteudo_site pra ver as chaves existentes antes de editar.',
        inputSchema: { key: z.string(), value: z.string() },
      },
      async ({ key, value }) => {
        await upsertSiteContent(key, value, client)
        return textResult({ key, value })
      }
    )
    server.registerTool(
      'delete_chave_conteudo_site',
      { title: 'Remover chave de conteúdo do site', inputSchema: { key: z.string() } },
      async ({ key }) => {
        await deleteSiteContentKey(key, client)
        return textResult({ deleted: key })
      }
    )
    server.registerTool(
      'upsert_link_contato',
      {
        title: 'Criar ou editar link de contato',
        inputSchema: {
          id: z.string().uuid().optional(),
          label: z.string().nullable().optional(),
          label_en: z.string().nullable().optional(),
          url: z.string(),
        },
      },
      async ({ id, label = null, label_en = null, url }) => {
        const link = id ? await updateContactLink(id, label, label_en, url, client) : await addContactLink(label, label_en, url, client)
        return textResult(link)
      }
    )
    server.registerTool(
      'delete_link_contato',
      { title: 'Excluir link de contato', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteContactLink(id, client)
        return textResult({ deleted: id })
      }
    )
  }
}
