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

export type ArchNode = {
  id: ArchNodeId
  label: string
  summary: string
  detail: string
  /** posição em % (0-100) dentro do mapa */
  x: number
  y: number
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
  },
  {
    id: 'busca',
    label: 'Busca',
    summary: 'Full-text + semântica, combinadas por RRF',
    detail:
      'POST /api/search junta busca full-text e busca semântica (embeddings) do Supabase via reciprocal rank fusion, com rate limit por IP.',
    x: 85,
    y: 75,
  },
  {
    id: 'supabase',
    label: 'Supabase',
    summary: 'Postgres + Auth — backend central',
    detail:
      'Guarda projetos, artigos, tecnologias, mensagens de contato, currículo e o conteúdo editável do site. RLS + grant em toda tabela nova.',
    x: 50,
    y: 50,
  },
  {
    id: 'admin',
    label: 'Dashboard admin',
    summary: 'Painel autenticado de edição de conteúdo',
    detail:
      'app/admin — login + abas (Projetos, Artigos, Tecnologias, Autores, Mensagens, Contato, Personalização, Currículo, Imagens, MCP). Mutações via lib/supabase/admin-queries.ts.',
    x: 15,
    y: 15,
  },
  {
    id: 'drive',
    label: 'Google Drive',
    summary: 'Imagens e vídeos, somente leitura',
    detail:
      'lib/drive.ts busca arquivos por nome numa pasta do Drive configurada no admin — nunca escreve nada lá.',
    x: 50,
    y: 5,
  },
  {
    id: 'mcp',
    label: 'Conexões MCP',
    summary: 'Ex: "ClaudeWeb" — expõe o site pra IA',
    detail:
      'app/api/mcp + lib/mcp/* implementam um servidor MCP: cada conexão tem um token e permissões próprias (ler projetos, ler mensagens, editar conteúdo etc.), configuradas no admin.',
    x: 15,
    y: 75,
  },
  {
    id: 'contato',
    label: 'Formulário de contato',
    summary: 'Mensagens recebidas pelo site',
    detail: 'app/(site)/contato envia pro Supabase; aparecem na aba Mensagens do admin.',
    x: 15,
    y: 45,
  },
  {
    id: 'easter-eggs',
    label: 'Easter eggs',
    summary: 'Konami code, sudo, mascote, spin...',
    detail:
      'Componentes client-side (SudoEasterEgg, SpinEasterEgg, Mascote com rickroll) ativados/desativados por uma flag no conteúdo do site.',
    x: 85,
    y: 45,
  },
  {
    id: 'status',
    label: 'Página de status',
    summary: 'Bastidores técnicos, ao vivo',
    detail:
      '/status mostra métricas reais: deploy atual, latência do banco, última republicação e último reindex de busca — nada simulado.',
    x: 50,
    y: 90,
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
