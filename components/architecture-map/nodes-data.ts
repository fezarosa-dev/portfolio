export type ArchNodeId =
  | 'paginas-publicas'
  | 'busca'
  | 'supabase'
  | 'admin'
  | 'drive'
  | 'mcp'
  | 'contato'
  | 'easter-eggs'
  | 'status'

export type Bilingual = { pt: string; en: string }

export type MicroStep = {
  label: Bilingual
  detail: Bilingual
}

export type ArchNode = {
  id: ArchNodeId
  label: Bilingual
  summary: Bilingual
  detail: Bilingual
  /** posição em % (0-100) dentro do mapa */
  x: number
  y: number
  /** passos reais do código, em ordem -- o "micro" por trás do nó macro */
  microSteps: MicroStep[]
  /** direção (não precisa ser unitário) pra onde o pipeline desse nó se estende, escolhida pra não bater em outro nó */
  dir: { dx: number; dy: number }
}

export type ArchEdge = {
  from: ArchNodeId
  to: ArchNodeId
  label: Bilingual
  /** índice (0-based) de um passo específico do pipeline de `from`/`to` --
   * quando presente, a conexão sai/chega nesse passo em vez da bolha do nó,
   * pra mostrar que é aquele passo específico (não o nó genérico) que segue
   * pra frente/recebe o valor. */
  fromStep?: number
  toStep?: number
}

export const architectureNodes: ArchNode[] = [
  {
    id: 'paginas-publicas',
    label: { pt: 'Páginas públicas', en: 'Public pages' },
    summary: {
      pt: 'Home, Sobre, Serviços, Projetos, Artigos, Contato, Currículo',
      en: 'Home, About, Services, Projects, Articles, Contact, Resume',
    },
    detail: {
      pt: 'App Router do Next.js, Server Components. Leem conteúdo do Supabase (cacheado) e imagens do Google Drive por nome, em Markdown.',
      en: "Next.js App Router, Server Components. They read content from Supabase (cached) and Google Drive images by name, in Markdown.",
    },
    x: 85,
    y: 15,
    dir: { dx: 1, dy: 0 },
    microSteps: [
      {
        label: { pt: 'Requisição chega', en: 'Request arrives' },
        detail: {
          pt: 'middleware.ts lê o path, detecta o locale (cookie "locale" ou Accept-Language via detectLocaleFromAcceptLanguage) e reescreve /pt/sobre -> /sobre com o header x-locale; /admin e /api passam direto (isPassthrough).',
          en: 'middleware.ts reads the path, detects the locale (the "locale" cookie or Accept-Language via detectLocaleFromAcceptLanguage) and rewrites /pt/sobre -> /sobre with the x-locale header; /admin and /api pass straight through (isPassthrough).',
        },
      },
      {
        label: { pt: 'Tema/animação já vêm certos', en: 'Theme/animation are already correct' },
        detail: {
          pt: 'app/layout.tsx lê os cookies "theme" e "reduce-motion" antes de renderizar -- sem cookie, o padrão é escuro e animado. Não depende de JS no cliente, então não tem flash de tema errado.',
          en: 'app/layout.tsx reads the "theme" and "reduce-motion" cookies before rendering -- with no cookie, the default is dark and animated. It doesn\'t depend on client-side JS, so there\'s no wrong-theme flash.',
        },
      },
      {
        label: { pt: 'Server Component roda', en: 'Server Component runs' },
        detail: {
          pt: 'A página (ex: app/(site)/sobre/page.tsx) é async e busca dados direto no servidor, sem JS extra pro cliente.',
          en: 'The page (e.g. app/(site)/sobre/page.tsx) is async and fetches data straight on the server, with no extra client-side JS.',
        },
      },
      {
        label: { pt: 'Conteúdo vem cacheado', en: 'Content comes cached' },
        detail: {
          pt: 'getSiteContent()/queries-cached.ts usa unstable_cache do Next -- não bate no Supabase em toda requisição.',
          en: "getSiteContent()/queries-cached.ts uses Next's unstable_cache -- it doesn't hit Supabase on every request.",
        },
      },
      {
        label: { pt: 'Texto bilíngue é resolvido', en: 'Bilingual text is resolved' },
        detail: {
          pt: 'resolveText(pt, en, locale) escolhe a versão certa do texto conforme o locale detectado, usando o dicionário de lib/i18n/dictionaries.ts.',
          en: 'resolveText(pt, en, locale) picks the right version of the text based on the detected locale, using the dictionary from lib/i18n/dictionaries.ts.',
        },
      },
      {
        label: { pt: 'HTML pronto é enviado', en: 'Ready-made HTML is sent' },
        detail: {
          pt: 'A página já renderizada chega no navegador; hidratação do React só liga as partes interativas (animações, forms).',
          en: 'The already-rendered page reaches the browser; React hydration only wires up the interactive parts (animations, forms).',
        },
      },
    ],
  },
  {
    id: 'busca',
    label: { pt: 'Busca', en: 'Search' },
    summary: { pt: 'Full-text + semântica, combinadas por RRF', en: 'Full-text + semantic, combined by RRF' },
    detail: {
      pt: 'POST /api/search junta busca full-text e busca semântica (embeddings) do Supabase via reciprocal rank fusion, com rate limit por IP.',
      en: 'POST /api/search combines full-text search and semantic search (embeddings) from Supabase via reciprocal rank fusion, with a per-IP rate limit.',
    },
    x: 85,
    y: 75,
    dir: { dx: 1, dy: 0 },
    microSteps: [
      {
        label: { pt: 'Pessoa digita', en: 'Person types' },
        detail: {
          pt: 'SearchPanel espera 300ms sem digitação (debounce) antes de disparar a busca, pra não bater na API em toda letra.',
          en: "SearchPanel waits 300ms of no typing (debounce) before firing the search, so it doesn't hit the API on every keystroke.",
        },
      },
      {
        label: { pt: 'POST /api/search', en: 'POST /api/search' },
        detail: {
          pt: 'app/api/search/route.ts recebe { query } e primeiro checa o rate limit (countRecentSearchesFromIp, padrão 20/min).',
          en: 'app/api/search/route.ts receives { query } and first checks the rate limit (countRecentSearchesFromIp, default 20/min).',
        },
      },
      {
        label: { pt: 'Duas buscas em paralelo', en: 'Two searches in parallel' },
        detail: {
          pt: 'searchFullText (Postgres, tsvector) e searchSemantic (embeddings) rodam ao mesmo tempo; a semântica tem timeout de 4s pra não travar a resposta.',
          en: 'searchFullText (Postgres, tsvector) and searchSemantic (embeddings) run at the same time; the semantic one has a 4s timeout so it never blocks the response.',
        },
      },
      {
        label: { pt: 'Reciprocal Rank Fusion', en: 'Reciprocal Rank Fusion' },
        detail: {
          pt: 'reciprocalRankFusion (lib/search/rank.ts) combina as duas listas de resultado num ranking só, sem um método dominar o outro.',
          en: 'reciprocalRankFusion (lib/search/rank.ts) merges both result lists into a single ranking, without either method dominating the other.',
        },
      },
      {
        label: { pt: 'Log e resposta', en: 'Log and response' },
        detail: {
          pt: 'logSearchRequest grava a busca (pra métricas de /status) e o resultado combinado volta pro SearchPanel.',
          en: 'logSearchRequest records the search (for /status metrics) and the combined result goes back to SearchPanel.',
        },
      },
    ],
  },
  {
    id: 'supabase',
    label: { pt: 'Supabase', en: 'Supabase' },
    summary: { pt: 'Postgres + Auth — backend central', en: 'Postgres + Auth — central backend' },
    detail: {
      pt: 'Guarda projetos, artigos, tecnologias, mensagens de contato, currículo e o conteúdo editável do site. RLS + grant em toda tabela nova.',
      en: 'Stores projects, articles, technologies, contact messages, the resume, and the site\'s editable content. RLS + grant on every new table.',
    },
    x: 50,
    y: 50,
    // não usa diagonal "pura" (0.7,0.7) de propósito -- numa grade simétrica
    // como essa, a diagonal a partir do centro cai quase em cima do nó do
    // canto (nesse caso, ia bater perto de "busca"). Essa direção sobe
    // levemente pra direita, passando entre drive (acima) e os dois nós da
    // coluna direita, sem cruzar o pipeline de nenhum dos dois.
    dir: { dx: 0.25, dy: -1 },
    microSteps: [
      {
        label: { pt: 'Toda tabela nova', en: 'Every new table' },
        detail: {
          pt: 'Migração cria a tabela + política de RLS + grant explícito -- RLS sozinha não libera o client JS do Supabase, precisa do grant também. Tabelas principais: projects, articles, languages, authors, companies, messages, resume, resume_links, contact_links, site_content, search_index, search_requests, mcp_connections (+ project_authors/project_languages como tabelas de junção).',
          en: "A migration creates the table + an RLS policy + an explicit grant -- RLS alone doesn't unlock Supabase's JS client, it needs the grant too. Main tables: projects, articles, languages, authors, companies, messages, resume, resume_links, contact_links, site_content, search_index, search_requests, mcp_connections (+ project_authors/project_languages as join tables).",
        },
      },
      {
        label: { pt: 'Leitura pública', en: 'Public reads' },
        detail: {
          pt: 'lib/supabase/queries.ts usa a anon key, só leitura, filtrando pelas policies de RLS (ex: só conteúdo visível).',
          en: 'lib/supabase/queries.ts uses the anon key, read-only, filtered by RLS policies (e.g. only visible content).',
        },
      },
      {
        label: { pt: 'Mutação autenticada', en: 'Authenticated mutation' },
        detail: {
          pt: 'lib/supabase/admin-queries.ts usa o client autenticado da sessão do admin -- policies de RLS exigem auth.uid() válido.',
          en: "lib/supabase/admin-queries.ts uses the admin session's authenticated client -- RLS policies require a valid auth.uid().",
        },
      },
      {
        label: { pt: 'Acesso via MCP', en: 'Access via MCP' },
        detail: {
          pt: 'lib/supabase/service.ts monta um client próprio por conexão MCP, respeitando as permissões daquele token específico.',
          en: 'lib/supabase/service.ts builds a dedicated client per MCP connection, respecting that specific token\'s permissions.',
        },
      },
    ],
  },
  {
    id: 'admin',
    label: { pt: 'Dashboard admin', en: 'Admin dashboard' },
    summary: { pt: 'Painel autenticado de edição de conteúdo', en: 'Authenticated content-editing panel' },
    detail: {
      pt: 'app/admin — login + abas (Projetos, Artigos, Tecnologias, Autores, Mensagens, Contato, Personalização, Currículo, Imagens, MCP). Mutações via lib/supabase/admin-queries.ts.',
      en: 'app/admin — login + tabs (Projects, Articles, Technologies, Authors, Messages, Contact, Customization, Resume, Images, MCP). Mutations go through lib/supabase/admin-queries.ts.',
    },
    x: 15,
    y: 15,
    dir: { dx: -1, dy: 0 },
    microSteps: [
      {
        label: { pt: 'Tenta acessar /admin', en: 'Tries to access /admin' },
        detail: {
          pt: 'middleware.ts intercepta e checa a sessão do Supabase Auth via cookie.',
          en: 'middleware.ts intercepts it and checks the Supabase Auth session via cookie.',
        },
      },
      {
        label: { pt: 'Sem sessão -> /admin/login', en: 'No session -> /admin/login' },
        detail: {
          pt: 'shouldRedirectToLogin decide o redirect; com sessão válida, a requisição segue normal.',
          en: 'shouldRedirectToLogin decides the redirect; with a valid session, the request just goes through.',
        },
      },
      {
        label: { pt: 'Login por e-mail/senha', en: 'Email/password login' },
        detail: {
          pt: 'app/admin/login/actions.ts chama supabase.auth.signInWithPassword({ email, password }); a sessão vira cookie via @supabase/ssr, sem token separado pra gerenciar no cliente.',
          en: 'app/admin/login/actions.ts calls supabase.auth.signInWithPassword({ email, password }); the session becomes a cookie via @supabase/ssr, with no separate token to manage on the client.',
        },
      },
      {
        label: { pt: 'Edita numa aba', en: 'Edits in a tab' },
        detail: {
          pt: 'Cada aba (Projetos, Artigos, Tecnologias, Autores, Empresas, Mensagens, Contato, Personalização, Currículo, Imagens, MCP, Preview) chama uma função de admin-queries.ts, ex: upsertProjeto.',
          en: 'Each tab (Projects, Articles, Technologies, Authors, Companies, Messages, Contact, Customization, Resume, Images, MCP, Preview) calls a function from admin-queries.ts, e.g. upsertProjeto.',
        },
      },
      {
        label: { pt: 'Grava no Postgres', en: 'Writes to Postgres' },
        detail: {
          pt: 'A mutação passa pelas policies de RLS que exigem usuário autenticado.',
          en: 'The mutation goes through RLS policies that require an authenticated user.',
        },
      },
      {
        label: { pt: 'Reindexa pra busca', en: 'Reindexes for search' },
        detail: {
          pt: 'reindexProject/reindexArticle (lib/supabase/search-index.ts) geram um embedding novo do texto e gravam na tabela search_index -- é o que a busca semântica lê depois.',
          en: 'reindexProject/reindexArticle (lib/supabase/search-index.ts) generate a fresh embedding of the text and write it to the search_index table -- that\'s what semantic search reads afterward.',
        },
      },
      {
        label: { pt: 'Cache do site precisa atualizar', en: 'The site\'s cache needs to update' },
        detail: {
          pt: 'Como o público lê via cache (unstable_cache), a mutação revalida a tag certa pra a mudança aparecer no site.',
          en: 'Since the public reads through a cache (unstable_cache), the mutation revalidates the right tag so the change shows up on the site.',
        },
      },
    ],
  },
  {
    id: 'drive',
    label: { pt: 'Google Drive', en: 'Google Drive' },
    summary: { pt: 'Imagens e vídeos, somente leitura', en: 'Images and videos, read-only' },
    detail: {
      pt: 'lib/drive.ts busca arquivos por nome numa pasta do Drive configurada no admin — nunca escreve nada lá.',
      en: "lib/drive.ts looks up files by name in a Drive folder configured in the admin -- it never writes anything there.",
    },
    x: 50,
    y: 5,
    dir: { dx: 0, dy: -1 },
    microSteps: [
      {
        label: { pt: 'Pasta configurada no admin', en: 'Folder configured in the admin' },
        detail: {
          pt: 'drive_folder_url no conteúdo do site guarda qual pasta do Drive é a fonte das imagens.',
          en: 'drive_folder_url in the site content stores which Drive folder is the source of the images.',
        },
      },
      {
        label: { pt: 'Markdown referencia por nome', en: 'Markdown references it by name' },
        detail: {
          pt: 'Um texto escreve ![foto](nome-do-arquivo.jpg); remark-drive-images resolve isso pra uma URL real.',
          en: 'A piece of text writes ![photo](file-name.jpg); remark-drive-images resolves that into a real URL.',
        },
      },
      {
        label: { pt: 'Busca na API do Drive', en: 'Looked up in the Drive API' },
        detail: {
          pt: 'lib/drive.ts procura o arquivo por nome dentro da pasta configurada -- token do Drive nunca sai do servidor.',
          en: "lib/drive.ts looks for the file by name inside the configured folder -- the Drive token never leaves the server.",
        },
      },
      {
        label: { pt: 'Proxy pro navegador', en: 'Proxied to the browser' },
        detail: {
          pt: '/api/drive-image/[fileId] e /api/drive-video/[fileId] servem o arquivo como proxy, sem expor a API do Drive direto pro cliente.',
          en: "/api/drive-image/[fileId] and /api/drive-video/[fileId] serve the file as a proxy, without exposing the Drive API directly to the client.",
        },
      },
    ],
  },
  {
    id: 'mcp',
    label: { pt: 'Conexões MCP', en: 'MCP connections' },
    summary: { pt: 'Ex: "ClaudeWeb" — expõe o site pra IA', en: 'E.g. "ClaudeWeb" — exposes the site to AI' },
    detail: {
      pt: 'app/api/mcp + lib/mcp/* implementam um servidor MCP: cada conexão tem um token e permissões próprias (ler projetos, ler mensagens, editar conteúdo etc.), configuradas no admin.',
      en: 'app/api/mcp + lib/mcp/* implement an MCP server: each connection has its own token and permissions (read projects, read messages, edit content, etc.), configured in the admin.',
    },
    x: 15,
    y: 75,
    dir: { dx: -1, dy: 0 },
    microSteps: [
      {
        label: { pt: 'Conexão criada no admin', en: 'Connection created in the admin' },
        detail: {
          pt: 'A aba MCP gera um token novo e define quais permissões aquela conexão específica tem.',
          en: 'The MCP tab generates a new token and sets which permissions that specific connection has.',
        },
      },
      {
        label: { pt: 'Cliente de IA chama a API', en: 'AI client calls the API' },
        detail: {
          pt: 'POST /api/mcp com o token (header Authorization ou X-Auth-Token, pra clientes que não deixam setar Authorization).',
          en: "POST /api/mcp with the token (Authorization header, or X-Auth-Token for clients that don't allow setting Authorization).",
        },
      },
      {
        label: { pt: 'Token é validado', en: 'Token gets validated' },
        detail: {
          pt: 'lib/mcp/auth.ts confere o token e carrega as permissões daquela conexão específica.',
          en: "lib/mcp/auth.ts checks the token and loads that specific connection's permissions.",
        },
      },
      {
        label: { pt: 'Servidor MCP é montado', en: 'MCP server is assembled' },
        detail: {
          pt: 'lib/mcp/server.ts + registerMcpTools só registram as tools/resources que aquela conexão tem permissão de usar.',
          en: 'lib/mcp/server.ts + registerMcpTools only register the tools/resources that connection has permission to use.',
        },
      },
      {
        label: { pt: 'Tool roda no Supabase', en: 'Tool runs against Supabase' },
        detail: {
          pt: 'Cada tool lê ou escreve via lib/supabase/service.ts, dentro do que foi permitido pra aquele token. Cobre CRUD completo por permissão: projetos, artigos, tecnologias, autores, empresas (upsert/delete/list de cada); mensagens (list/marcar lida/delete); links de contato e de currículo; currículo (read/update); e o conteúdo do site (read/set/delete de cada chave).',
          en: 'Each tool reads or writes via lib/supabase/service.ts, within what that token was granted. Covers full CRUD per permission: projects, articles, technologies, authors, companies (upsert/delete/list of each); messages (list/mark read/delete); contact and resume links; resume (read/update); and site content (read/set/delete of each key).',
        },
      },
    ],
  },
  {
    id: 'contato',
    label: { pt: 'Formulário de contato', en: 'Contact form' },
    summary: { pt: 'Mensagens recebidas pelo site', en: 'Messages received through the site' },
    detail: {
      pt: 'app/(site)/contato envia pro Supabase; aparecem na aba Mensagens do admin.',
      en: 'app/(site)/contato sends to Supabase; the messages show up in the admin\'s Messages tab.',
    },
    x: 15,
    y: 45,
    dir: { dx: -1, dy: 0 },
    microSteps: [
      {
        label: { pt: 'Formulário client-side', en: 'Client-side form' },
        detail: {
          pt: 'contact-form.tsx valida nome/e-mail/mensagem antes de enviar.',
          en: 'contact-form.tsx validates name/email/message before sending.',
        },
      },
      {
        label: { pt: 'Grava no Supabase', en: 'Writes to Supabase' },
        detail: {
          pt: 'A mensagem é salva numa tabela própria, sem precisar de autenticação (RLS permite só o insert).',
          en: 'The message is saved to its own table, no authentication needed (RLS only allows the insert).',
        },
      },
      {
        label: { pt: 'Aparece no admin', en: 'Shows up in the admin' },
        detail: {
          pt: 'A aba Mensagens lista as mensagens recebidas, com opção de marcar como lida.',
          en: 'The Messages tab lists the received messages, with an option to mark them as read.',
        },
      },
      {
        label: { pt: 'Também acessível via MCP', en: 'Also reachable via MCP' },
        detail: {
          pt: 'Uma conexão MCP com a permissão certa pode ler as mensagens de contato como recurso.',
          en: 'An MCP connection with the right permission can read the contact messages as a resource.',
        },
      },
    ],
  },
  {
    id: 'easter-eggs',
    label: { pt: 'Easter eggs', en: 'Easter eggs' },
    summary: { pt: 'Konami code, sudo, mascote, spin...', en: 'Konami code, sudo, mascot, spin...' },
    detail: {
      pt: 'Componentes client-side (SudoEasterEgg, SpinEasterEgg, Mascote com rickroll) ativados/desativados por uma flag no conteúdo do site.',
      en: 'Client-side components (SudoEasterEgg, SpinEasterEgg, Mascote with a rickroll) turned on/off by a flag in the site content.',
    },
    x: 85,
    y: 45,
    dir: { dx: 1, dy: 0 },
    microSteps: [
      {
        label: { pt: 'Flag geral no admin', en: 'General flag in the admin' },
        detail: {
          pt: 'easter_eggs_ativo liga/desliga todos de uma vez, sem precisar deploy novo.',
          en: 'easter_eggs_ativo turns all of them on/off at once, with no new deploy needed.',
        },
      },
      {
        label: { pt: 'Cada um é independente', en: 'Each one is independent' },
        detail: {
          pt: 'SudoEasterEgg, SpinEasterEgg e Mascote são componentes client separados, cada um escutando seu próprio gatilho.',
          en: 'SudoEasterEgg, SpinEasterEgg and Mascote are separate client components, each listening for its own trigger.',
        },
      },
      {
        label: { pt: 'Exemplo: o mascote', en: 'Example: the mascot' },
        detail: {
          pt: 'Mascote conta cliques numa janela de tempo curta; ao bater o número certo, abre o vídeo via /api/drive-video/[fileId].',
          en: 'Mascote counts clicks within a short time window; once it hits the right number, it opens the video via /api/drive-video/[fileId].',
        },
      },
    ],
  },
  {
    id: 'status',
    label: { pt: 'Página de status', en: 'Status page' },
    summary: { pt: 'Bastidores técnicos, ao vivo', en: 'Technical internals, live' },
    detail: {
      pt: '/status mostra métricas reais: deploy atual, latência do banco, última republicação e último reindex de busca — nada simulado.',
      en: '/status shows real metrics: current deploy, database latency, last republish and last search reindex — nothing simulated.',
    },
    x: 50,
    y: 90,
    dir: { dx: 0, dy: 1 },
    microSteps: [
      {
        label: { pt: 'Página busca ao vivo', en: 'Page fetches live' },
        detail: {
          pt: 'A cada acesso a /status, o servidor mede as métricas na hora -- nada fica pré-calculado. Mostra também o deploy atual e a branch em uso, lidos de verdade, não hardcoded.',
          en: "Every time /status is loaded, the server measures the metrics on the spot -- nothing is pre-computed. It also shows the current deploy and branch, read for real, not hardcoded.",
        },
      },
      {
        label: { pt: 'Latência do banco', en: 'Database latency' },
        detail: {
          pt: 'Uma query simples é cronometrada contra o Supabase pra mostrar o tempo real de resposta.',
          en: 'A simple query is timed against Supabase to show the real response time.',
        },
      },
      {
        label: { pt: 'Última republicação/reindex', en: 'Last republish/reindex' },
        detail: {
          pt: 'Timestamps guardados no próprio conteúdo do site, atualizados quando o conteúdo muda ou a busca é reindexada.',
          en: 'Timestamps stored in the site content itself, updated whenever the content changes or search gets reindexed.',
        },
      },
    ],
  },
]

export const architectureEdges: ArchEdge[] = [
  { from: 'admin', to: 'supabase', label: { pt: 'edita conteúdo', en: 'edits content' } },
  { from: 'supabase', to: 'paginas-publicas', label: { pt: 'conteúdo lido (cacheado)', en: 'content read (cached)' } },
  { from: 'paginas-publicas', to: 'busca', label: { pt: 'usuário busca', en: 'user searches' } },
  { from: 'busca', to: 'supabase', label: { pt: 'full-text + semântica', en: 'full-text + semantic' } },
  { from: 'mcp', to: 'supabase', label: { pt: 'lê/escreve conforme permissão', en: 'reads/writes per permission' } },
  { from: 'drive', to: 'paginas-publicas', label: { pt: 'imagens/vídeos', en: 'images/videos' } },
  { from: 'contato', to: 'supabase', label: { pt: 'envia mensagem', en: 'sends message' } },
  { from: 'supabase', to: 'admin', label: { pt: 'mensagens recebidas', en: 'messages received' } },
  // era "easter-eggs -> páginas públicas" (rótulo dizia "ativados por
  // flag", mas a seta ia no sentido contrário do que ativa o quê -- a flag
  // que liga/desliga vive no conteúdo do site, no Supabase, não nos
  // próprios easter eggs). Corrigido pra sair de onde a flag realmente mora.
  { from: 'supabase', to: 'easter-eggs', label: { pt: 'flag liga/desliga', en: 'flag turns on/off' } },
  { from: 'status', to: 'supabase', label: { pt: 'latência/volume', en: 'latency/volume' } },
]
