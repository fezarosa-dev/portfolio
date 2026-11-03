import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getLanguages, getLanguageCategories, getAuthors, getCompanies, getCompanyClients, getContactLinks, getSiteContent } from '@/lib/supabase/queries'
import {
  getAllProjects,
  upsertProject,
  deleteProject,
  setProjectLanguages,
  setProjectAuthors,
  setProjectsClient,
  addCompany,
  updateCompany,
  deleteCompany,
  addCompanyClient,
  updateCompanyClient,
  deleteCompanyClient,
  getAllArticles,
  upsertArticle,
  deleteArticle,
  addLanguage,
  updateLanguage,
  deleteLanguage,
  setLanguageCategory,
  setLanguageShowOnHome,
  addLanguageCategory,
  updateLanguageCategory,
  deleteLanguageCategory,
  moveLanguageCategory,
  addAuthor,
  updateAuthor,
  deleteAuthor,
  upsertSiteContent,
  deleteSiteContentKey,
  addContactLink,
  updateContactLink,
  deleteContactLink,
  listMessages,
  markMessageRead,
  deleteMessage,
} from '@/lib/supabase/admin-queries'
import { reindexProject, reindexArticle, reindexLanguage } from '@/lib/supabase/search-index'
import { mapProjectRow, PROJECT_SELECT, type ProjectRow } from '@/lib/supabase/queries'
import { canRead, canWrite, type McpPermissions } from './resources'
import { registerResumeTools } from './resume-tools'
import { registerSiteTools } from './site-tools'
import { PROJECT_TEMPLATE } from './project-template'
import { CLIENTS_TEMPLATE } from './clients-template'
import { homeWarningFor } from './home-check'
import { lookupCep } from '@/lib/cep'
import { clientBreakdown } from '@/lib/company-count'

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
    server.registerTool(
      'list_grupos_clientes',
      {
        title: 'Listar grupos de clientes',
        description:
          'Grupos de clientes dentro das empresas (ex.: clientes diferentes dentro de "Freelancer"). Cada grupo conta como um cliente no número de empresas do site; o nome é interno (não aparece no site).',
      },
      async () => textResult(await getCompanyClients(client))
    )
    server.registerTool(
      'read_contagem_clientes',
      {
        title: 'Conferir a contagem de empresas',
        description:
          'O número de "empresas atendidas" que o site mostra, explicado: cada cliente contado (grupo ou empresa) com os projetos que o fazem contar, os projetos fora da conta e avisos de configuração. Rode antes e depois de mexer em grupos.',
      },
      async () => {
        const [projects, companies, clients] = await Promise.all([getAllProjects(client), getCompanies(client), getCompanyClients(client)])
        return textResult(clientBreakdown(projects, companies, clients))
      }
    )
    server.registerTool(
      'get_template_empresas',
      {
        title: 'Guia de empresas e grupos de clientes',
        description: 'Como o site conta as empresas atendidas e o passo a passo para configurar grupos de clientes (ex.: clientes de Freelancer). Leia antes de mexer em grupos.',
      },
      async () => textResult(CLIENTS_TEMPLATE)
    )
  }
  if (canWrite(permissions, 'projetos')) {
    server.registerTool(
      'get_template_projeto',
      {
        title: 'Template de projeto',
        description: 'Devolve o template (campos públicos + ocultos do currículo) a seguir ao cadastrar projetos com upsert_projeto. Leia antes de criar projetos.',
      },
      async () => textResult(PROJECT_TEMPLATE)
    )
    server.registerResource(
      'template-projeto',
      'template://projeto',
      { title: 'Template de projeto', description: 'Campos públicos e ocultos do currículo pra cadastrar projetos', mimeType: 'text/markdown' },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: PROJECT_TEMPLATE }] })
    )
    server.registerPrompt(
      'novo_projeto',
      {
        title: 'Cadastrar projeto seguindo o template',
        description: 'Orienta a IA a cadastrar um projeto (e seus campos de currículo) via MCP.',
        argsSchema: { descricao: z.string().describe('O que é o projeto, em linguagem livre') },
      },
      ({ descricao }) => ({
        messages: [
          {
            role: 'user' as const,
            content: { type: 'text' as const, text: `${PROJECT_TEMPLATE}\n\nCadastre este projeto seguindo o template acima:\n${descricao}` },
          },
        ],
      })
    )
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
          status: z
            .enum(['producao', 'prototipo', 'encerrado'])
            .nullable()
            .optional()
            .describe('Estado do projeto, mostrado no visor do servidor da home; null esconde'),
          highlight: z.string().nullable().optional().describe('Número de destaque real e verificável (PT), ex.: "10 mi de eventos/dia"; aparece no servidor da home'),
          highlight_en: z.string().nullable().optional(),
          position: z.number().int().optional().describe('Ordem na lista (maior aparece primeiro)'),
          company_id: z.string().uuid().nullable().optional(),
          client_id: z
            .string()
            .uuid()
            .nullable()
            .optional()
            .describe('Grupo de cliente (list_grupos_clientes) da MESMA empresa do projeto; null tira do grupo. Trocar company_id sem mandar client_id tira o projeto do grupo antigo.'),
          language_ids: z.array(z.string().uuid()).optional().describe('Substitui as tecnologias vinculadas ao projeto'),
          author_ids: z.array(z.string().uuid()).optional().describe('Substitui os autores vinculados ao projeto'),
          in_resume: z.boolean().optional().describe('Incluir no currículo (campo oculto ao público)'),
          resume_what: z.string().nullable().optional().describe('Currículo — "O quê" (oculto ao público)'),
          resume_what_en: z.string().nullable().optional(),
          resume_with: z.string().nullable().optional().describe('Currículo — "Com quê" (oculto ao público)'),
          resume_with_en: z.string().nullable().optional(),
          resume_solves: z.string().nullable().optional().describe('Currículo — "Resolve" (oculto ao público)'),
          resume_solves_en: z.string().nullable().optional(),
        },
      },
      async ({ language_ids, author_ids, ...input }) => {
        // o grupo é da empresa: mudou de empresa sem dizer o grupo, o projeto sai do grupo antigo
        if (input.id && input.company_id !== undefined && input.client_id === undefined) {
          const { data } = await client.from('projects').select('company_id').eq('id', input.id).single()
          if (data && data.company_id !== input.company_id) input.client_id = null
        }
        if (input.company_id === null) input.client_id = null
        const saved = await upsertProject(input, client)
        if (language_ids) await setProjectLanguages(saved.id, language_ids, client)
        if (author_ids) await setProjectAuthors(saved.id, author_ids, client)
        const full = await reloadProject(saved.id, client)
        await reindexProject(full, client)
        const aviso_home = await homeWarningFor(client)
        return textResult(aviso_home ? { aviso_home, projeto: full } : full)
      }
    )
    server.registerTool(
      'delete_projeto',
      { title: 'Excluir projeto', description: 'Remove um projeto permanentemente.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteProject(id, client)
        const aviso_home = await homeWarningFor(client)
        if (aviso_home) return textResult({ deleted: id, aviso_home })
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
      'upsert_grupo_cliente',
      {
        title: 'Criar ou renomear grupo de cliente',
        description:
          'Cria um grupo de cliente dentro de uma empresa (sem "id", com company_id e name) ou renomeia um existente (com "id" e name). Com project_ids, define a lista inteira de projetos do grupo na mesma chamada (os que saírem da lista ficam sem grupo). Devolve o grupo e a contagem atualizada. Guia: get_template_empresas.',
        inputSchema: {
          id: z.string().uuid().optional(),
          company_id: z.string().uuid().optional().describe('Obrigatório ao criar'),
          name: z.string().min(1),
          project_ids: z
            .array(z.string().uuid())
            .optional()
            .describe('Projetos do grupo (list_projetos), todos da mesma empresa do grupo. Substitui a lista atual; omita para não mexer.'),
        },
      },
      async ({ id, company_id, name, project_ids }) => {
        if (!id && !company_id) throw new Error('company_id é obrigatório para criar um grupo')
        const group = id ? await updateCompanyClient(id, name, client) : await addCompanyClient(company_id!, name, client)
        if (project_ids) {
          const { data, error } = await client.from('projects').select('id').eq('client_id', group.id)
          if (error) throw error
          // confere e põe os novos antes de soltar os antigos: se algum projeto não bater, nada muda
          await setProjectsClient(project_ids, group.id, client)
          await setProjectsClient(data.map((p) => p.id).filter((pid) => !project_ids.includes(pid)), null, client)
        }
        const [projects, companies, clients] = await Promise.all([getAllProjects(client), getCompanies(client), getCompanyClients(client)])
        return textResult({ grupo: group, contagem: clientBreakdown(projects, companies, clients) })
      }
    )
    server.registerTool(
      'delete_grupo_cliente',
      {
        title: 'Excluir grupo de cliente',
        description: 'Remove o grupo; os projetos dele continuam na empresa, só saem do grupo.',
        inputSchema: { id: z.string().uuid() },
      },
      async ({ id }) => {
        await deleteCompanyClient(id, client)
        return textResult({ deleted: id })
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
      { title: 'Listar tecnologias', description: 'Lista as tecnologias cadastradas, com o "category_id" de cada uma.' },
      async () => textResult(await getLanguages(client))
    )
    server.registerTool(
      'list_categorias_tecnologia',
      {
        title: 'Listar categorias de tecnologia',
        description: 'Lista as categorias que agrupam as tecnologias na página /tecnologias, na ordem de exibição.',
      },
      async () => textResult(await getLanguageCategories(client))
    )
  }
  if (canWrite(permissions, 'tecnologias')) {
    server.registerTool(
      'upsert_tecnologia',
      {
        title: 'Criar ou editar tecnologia',
        description:
          'Cria uma tecnologia nova (sem "id") ou renomeia uma existente (com "id"). O ícone é resolvido automaticamente pelo nome (devicon), a menos que "icon_url" seja informado.',
        inputSchema: {
          id: z.string().uuid().optional(),
          name: z.string().describe('Nome em português'),
          name_en: z.string().nullable().optional().describe('Nome em inglês; vazio/null cai pro nome PT; omitido não altera'),
          icon_url: z.string().optional(),
          category_id: z
            .string()
            .uuid()
            .nullable()
            .optional()
            .describe('Categoria da tecnologia (veja list_categorias_tecnologia); null remove a categoria; omitido não altera'),
          show_on_home: z.boolean().optional().describe('Mostrar na home; omitido não altera'),
        },
      },
      async ({ id, name, name_en, icon_url, category_id, show_on_home }) => {
        const saved = id ? await updateLanguage(id, name, icon_url, name_en, client) : await addLanguage(name, icon_url, name_en, client)
        if (category_id !== undefined) {
          await setLanguageCategory(saved.id, category_id, client)
          saved.category_id = category_id
        }
        if (show_on_home !== undefined) await setLanguageShowOnHome(saved.id, show_on_home, client)
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
    server.registerTool(
      'upsert_categoria_tecnologia',
      {
        title: 'Criar ou editar categoria de tecnologia',
        description: 'Cria uma categoria nova (sem "id") ou edita uma existente (com "id"). "name_en" é o nome em inglês.',
        inputSchema: { id: z.string().uuid().optional(), name: z.string(), name_en: z.string().optional() },
      },
      async ({ id, name, name_en }) =>
        textResult(
          id
            ? await updateLanguageCategory(id, name, name_en, client)
            : await addLanguageCategory(name, name_en, client)
        )
    )
    server.registerTool(
      'mover_categoria_tecnologia',
      {
        title: 'Mover categoria de tecnologia',
        description: 'Sobe (-1) ou desce (1) uma categoria na ordem de exibição da página /tecnologias.',
        inputSchema: { id: z.string().uuid(), direction: z.union([z.literal(-1), z.literal(1)]) },
      },
      async ({ id, direction }) => {
        await moveLanguageCategory(id, direction, client)
        return textResult(await getLanguageCategories(client))
      }
    )
    server.registerTool(
      'delete_categoria_tecnologia',
      {
        title: 'Excluir categoria de tecnologia',
        description: 'Remove a categoria; as tecnologias dela ficam sem categoria.',
        inputSchema: { id: z.string().uuid() },
      },
      async ({ id }) => {
        await deleteLanguageCategory(id, client)
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

  // --- currículo estruturado ---
  registerResumeTools(server, permissions, client)

  // --- template geral, visibilidade e ordenação ---
  registerSiteTools(server, permissions, client)

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
          'Define o valor de uma chave de conteúdo do site (ex.: "seo_home_title", "sobre_texto_pt", "search_rate_limit_max"; "tecnologias_ativo" = "true"/"false" liga/desliga a página /tecnologias). Use read_conteudo_site pra ver as chaves existentes antes de editar.',
        inputSchema: { key: z.string(), value: z.string() },
      },
      async ({ key, value }) => {
        await upsertSiteContent(key, value, client)
        return textResult({ key, value })
      }
    )
    server.registerTool(
      'set_local_lancamento',
      {
        title: 'Definir de onde o foguete sai (CEP)',
        description:
          'CEP da localização de trabalho: confere o CEP (BrasilAPI, reserva ViaCEP), pega cidade e coordenadas e salva. O globo do contato gira para esse ponto, destaca o país e o foguete sai dali (no site só o ponto, sem o nome da cidade). Erro legível se o CEP não existir.',
        inputSchema: { cep: z.string().describe('8 dígitos, com ou sem hífen (ex.: 37500-903)') },
      },
      async ({ cep }) => {
        const place = await lookupCep(cep)
        const values = {
          launch_cep: place.cep,
          launch_lat: String(place.lat),
          launch_lon: String(place.lon),
          launch_place: `${place.city} – ${place.state}`,
        }
        for (const [key, value] of Object.entries(values)) await upsertSiteContent(key, value, client)
        return textResult({ salvo: values })
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

  // --- mensagens recebidas pelo formulário de contato ---
  if (canRead(permissions, 'mensagens')) {
    server.registerTool(
      'list_mensagens',
      { title: 'Listar mensagens', description: 'Lista as mensagens recebidas pelo formulário de contato, mais recentes primeiro.' },
      async () => textResult(await listMessages(client))
    )
  }
  if (canWrite(permissions, 'mensagens')) {
    server.registerTool(
      'marcar_mensagem_lida',
      {
        title: 'Marcar mensagem como lida/não lida',
        inputSchema: { id: z.string().uuid(), read: z.boolean() },
      },
      async ({ id, read }) => {
        await markMessageRead(id, read, client)
        return textResult({ id, read })
      }
    )
    server.registerTool(
      'delete_mensagem',
      { title: 'Excluir mensagem', description: 'Remove uma mensagem permanentemente.', inputSchema: { id: z.string().uuid() } },
      async ({ id }) => {
        await deleteMessage(id, client)
        return textResult({ deleted: id })
      }
    )
  }
}
