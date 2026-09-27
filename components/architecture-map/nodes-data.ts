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

export type MicroStep = {
  label: string
  detail: string
}

export type ArchNode = {
  id: ArchNodeId
  label: string
  summary: string
  detail: string
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
  label: string
}

export const architectureNodes: ArchNode[] = [
  {
    id: 'paginas-publicas',
    label: 'Páginas públicas',
    summary: 'Home, Sobre, Serviços, Projetos, Artigos, Contato, Currículo',
    detail:
      'App Router do Next.js, Server Components. Leem conteúdo do Supabase (cacheado) e imagens do Google Drive por nome, em Markdown.',
    x: 85,
    y: 15,
    dir: { dx: 1, dy: 0 },
    microSteps: [
      { label: 'Requisição chega', detail: 'middleware.ts lê o path, detecta o locale (cookie ou Accept-Language) e reescreve /pt/sobre -> /sobre com o header x-locale.' },
      { label: 'Server Component roda', detail: 'A página (ex: app/(site)/sobre/page.tsx) é async e busca dados direto no servidor, sem JS extra pro cliente.' },
      { label: 'Conteúdo vem cacheado', detail: 'getSiteContent()/queries-cached.ts usa unstable_cache do Next -- não bate no Supabase em toda requisição.' },
      { label: 'Texto bilíngue é resolvido', detail: 'resolveText(pt, en, locale) escolhe a versão certa do texto conforme o locale detectado.' },
      { label: 'HTML pronto é enviado', detail: 'A página já renderizada chega no navegador; hidratação do React só liga as partes interativas (animações, forms).' },
    ],
  },
  {
    id: 'busca',
    label: 'Busca',
    summary: 'Full-text + semântica, combinadas por RRF',
    detail:
      'POST /api/search junta busca full-text e busca semântica (embeddings) do Supabase via reciprocal rank fusion, com rate limit por IP.',
    x: 85,
    y: 75,
    dir: { dx: 1, dy: 0 },
    microSteps: [
      { label: 'Pessoa digita', detail: 'SearchPanel espera 300ms sem digitação (debounce) antes de disparar a busca, pra não bater na API em toda letra.' },
      { label: 'POST /api/search', detail: 'app/api/search/route.ts recebe { query } e primeiro checa o rate limit (countRecentSearchesFromIp, padrão 20/min).' },
      { label: 'Duas buscas em paralelo', detail: 'searchFullText (Postgres, tsvector) e searchSemantic (embeddings) rodam ao mesmo tempo; a semântica tem timeout de 4s pra não travar a resposta.' },
      { label: 'Reciprocal Rank Fusion', detail: 'reciprocalRankFusion (lib/search/rank.ts) combina as duas listas de resultado num ranking só, sem um método dominar o outro.' },
      { label: 'Log e resposta', detail: 'logSearchRequest grava a busca (pra métricas de /status) e o resultado combinado volta pro SearchPanel.' },
    ],
  },
  {
    id: 'supabase',
    label: 'Supabase',
    summary: 'Postgres + Auth — backend central',
    detail:
      'Guarda projetos, artigos, tecnologias, mensagens de contato, currículo e o conteúdo editável do site. RLS + grant em toda tabela nova.',
    x: 50,
    y: 50,
    dir: { dx: 0.7, dy: 0.7 },
    microSteps: [
      { label: 'Toda tabela nova', detail: 'Migração cria a tabela + política de RLS + grant explícito -- RLS sozinha não libera o client JS do Supabase, precisa do grant também.' },
      { label: 'Leitura pública', detail: 'lib/supabase/queries.ts usa a anon key, só leitura, filtrando pelas policies de RLS (ex: só conteúdo visível).' },
      { label: 'Mutação autenticada', detail: 'lib/supabase/admin-queries.ts usa o client autenticado da sessão do admin -- policies de RLS exigem auth.uid() válido.' },
      { label: 'Acesso via MCP', detail: 'lib/supabase/service.ts monta um client próprio por conexão MCP, respeitando as permissões daquele token específico.' },
    ],
  },
  {
    id: 'admin',
    label: 'Dashboard admin',
    summary: 'Painel autenticado de edição de conteúdo',
    detail:
      'app/admin — login + abas (Projetos, Artigos, Tecnologias, Autores, Mensagens, Contato, Personalização, Currículo, Imagens, MCP). Mutações via lib/supabase/admin-queries.ts.',
    x: 15,
    y: 15,
    dir: { dx: -1, dy: 0 },
    microSteps: [
      { label: 'Tenta acessar /admin', detail: 'middleware.ts intercepta e checa a sessão do Supabase Auth via cookie.' },
      { label: 'Sem sessão -> /admin/login', detail: 'shouldRedirectToLogin decide o redirect; com sessão válida, a requisição segue normal.' },
      { label: 'Edita numa aba', detail: 'Cada aba (Projetos, Artigos...) chama uma função de admin-queries.ts, ex: upsertProjeto.' },
      { label: 'Grava no Postgres', detail: 'A mutação passa pelas policies de RLS que exigem usuário autenticado.' },
      { label: 'Cache do site precisa atualizar', detail: 'Como o público lê via cache (unstable_cache), a mutação revalida a tag certa pra a mudança aparecer no site.' },
    ],
  },
  {
    id: 'drive',
    label: 'Google Drive',
    summary: 'Imagens e vídeos, somente leitura',
    detail:
      'lib/drive.ts busca arquivos por nome numa pasta do Drive configurada no admin — nunca escreve nada lá.',
    x: 50,
    y: 5,
    dir: { dx: 0, dy: -1 },
    microSteps: [
      { label: 'Pasta configurada no admin', detail: 'drive_folder_url no conteúdo do site guarda qual pasta do Drive é a fonte das imagens.' },
      { label: 'Markdown referencia por nome', detail: 'Um texto escreve ![foto](nome-do-arquivo.jpg); remark-drive-images resolve isso pra uma URL real.' },
      { label: 'Busca na API do Drive', detail: 'lib/drive.ts procura o arquivo por nome dentro da pasta configurada -- token do Drive nunca sai do servidor.' },
      { label: 'Proxy pro navegador', detail: '/api/drive-image/[fileId] e /api/drive-video/[fileId] servem o arquivo como proxy, sem expor a API do Drive direto pro cliente.' },
    ],
  },
  {
    id: 'mcp',
    label: 'Conexões MCP',
    summary: 'Ex: "ClaudeWeb" — expõe o site pra IA',
    detail:
      'app/api/mcp + lib/mcp/* implementam um servidor MCP: cada conexão tem um token e permissões próprias (ler projetos, ler mensagens, editar conteúdo etc.), configuradas no admin.',
    x: 15,
    y: 75,
    dir: { dx: -1, dy: 0 },
    microSteps: [
      { label: 'Conexão criada no admin', detail: 'A aba MCP gera um token novo e define quais permissões aquela conexão específica tem.' },
      { label: 'Cliente de IA chama a API', detail: 'POST /api/mcp com o token (header Authorization ou X-Auth-Token, pra clientes que não deixam setar Authorization).' },
      { label: 'Token é validado', detail: 'lib/mcp/auth.ts confere o token e carrega as permissões daquela conexão específica.' },
      { label: 'Servidor MCP é montado', detail: 'lib/mcp/server.ts + registerMcpTools só registram as tools/resources que aquela conexão tem permissão de usar.' },
      { label: 'Tool roda no Supabase', detail: 'Cada tool lê ou escreve via lib/supabase/service.ts, dentro do que foi permitido pra aquele token.' },
    ],
  },
  {
    id: 'contato',
    label: 'Formulário de contato',
    summary: 'Mensagens recebidas pelo site',
    detail: 'app/(site)/contato envia pro Supabase; aparecem na aba Mensagens do admin.',
    x: 15,
    y: 45,
    dir: { dx: -1, dy: 0 },
    microSteps: [
      { label: 'Formulário client-side', detail: 'contact-form.tsx valida nome/e-mail/mensagem antes de enviar.' },
      { label: 'Grava no Supabase', detail: 'A mensagem é salva numa tabela própria, sem precisar de autenticação (RLS permite só o insert).' },
      { label: 'Aparece no admin', detail: 'A aba Mensagens lista as mensagens recebidas, com opção de marcar como lida.' },
      { label: 'Também acessível via MCP', detail: 'Uma conexão MCP com a permissão certa pode ler as mensagens de contato como recurso.' },
    ],
  },
  {
    id: 'easter-eggs',
    label: 'Easter eggs',
    summary: 'Konami code, sudo, mascote, spin...',
    detail:
      'Componentes client-side (SudoEasterEgg, SpinEasterEgg, Mascote com rickroll) ativados/desativados por uma flag no conteúdo do site.',
    x: 85,
    y: 45,
    dir: { dx: 1, dy: 0 },
    microSteps: [
      { label: 'Flag geral no admin', detail: 'easter_eggs_ativo liga/desliga todos de uma vez, sem precisar deploy novo.' },
      { label: 'Cada um é independente', detail: 'SudoEasterEgg, SpinEasterEgg e Mascote são componentes client separados, cada um escutando seu próprio gatilho.' },
      { label: 'Exemplo: o mascote', detail: 'Mascote conta cliques numa janela de tempo curta; ao bater o número certo, abre o vídeo via /api/drive-video/[fileId].' },
    ],
  },
  {
    id: 'status',
    label: 'Página de status',
    summary: 'Bastidores técnicos, ao vivo',
    detail:
      '/status mostra métricas reais: deploy atual, latência do banco, última republicação e último reindex de busca — nada simulado.',
    x: 50,
    y: 90,
    dir: { dx: 0, dy: 1 },
    microSteps: [
      { label: 'Página busca ao vivo', detail: 'A cada acesso a /status, o servidor mede as métricas na hora -- nada fica pré-calculado.' },
      { label: 'Latência do banco', detail: 'Uma query simples é cronometrada contra o Supabase pra mostrar o tempo real de resposta.' },
      { label: 'Última republicação/reindex', detail: 'Timestamps guardados no próprio conteúdo do site, atualizados quando o conteúdo muda ou a busca é reindexada.' },
    ],
  },
]

export const architectureEdges: ArchEdge[] = [
  { from: 'admin', to: 'supabase', label: 'edita conteúdo' },
  { from: 'supabase', to: 'paginas-publicas', label: 'conteúdo lido (cacheado)' },
  { from: 'paginas-publicas', to: 'busca', label: 'usuário busca' },
  { from: 'busca', to: 'supabase', label: 'full-text + semântica' },
  { from: 'mcp', to: 'supabase', label: 'lê/escreve conforme permissão' },
  { from: 'drive', to: 'paginas-publicas', label: 'imagens/vídeos' },
  { from: 'contato', to: 'supabase', label: 'envia mensagem' },
  { from: 'supabase', to: 'admin', label: 'mensagens recebidas' },
  { from: 'easter-eggs', to: 'paginas-publicas', label: 'ativados por flag' },
  { from: 'status', to: 'supabase', label: 'latência/volume' },
  { from: 'status', to: 'busca', label: 'último reindex' },
]
