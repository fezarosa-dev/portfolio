# Portfólio — Felipe Zanoni da Rosa

[![CI](https://github.com/fezarosa-dev/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/fezarosa-dev/portfolio/actions/workflows/ci.yml)
[![Licença MIT + Commons Clause](https://img.shields.io/badge/licença-MIT%20%2B%20Commons%20Clause-blue.svg)](./LICENSE)

Site pessoal e portfólio, construído com Next.js (App Router) e Supabase. Inclui um painel administrativo em `/admin` para gerenciar projetos, artigos, currículo, mensagens de contato e os textos/imagens do site, sem precisar mexer em código.

🔗 [zanoni.dev.br](https://www.zanoni.dev.br)

## Funcionalidades

- Conteúdo bilíngue (PT/EN) em todo o site, com rotas indexáveis separadamente (`/pt`, `/en`) e `hreflang` pro SEO.
- Modo claro/escuro, seguindo o sistema operacional até o visitante escolher explicitamente.
- Preferência de "reduzir animações" (acessibilidade), respeitada por todos os componentes com movimento.
- Painel administrativo (`/admin`) com CRUD de projetos, empresas, tecnologias, artigos, currículo e conteúdo geral do site.
- Exportação dos dados do portfólio em JSON (`/api`).
- Grid de projetos em masonry, com busca por tecnologia, empresa e coautor.
- Busca híbrida (full-text + semântica) sobre projetos, artigos e páginas — veja [Busca](#busca) abaixo.
- Servidor MCP (`/api/mcp`), configurável pelo painel admin, pra uma IA ler e editar o conteúdo do site sob permissão — veja [Conexões MCP](#conexões-mcp) abaixo.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/) para animações
- [Supabase](https://supabase.com/) (Postgres + Auth + `pgvector`) como backend
- [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) rodando localmente no servidor, para os embeddings da busca semântica (sem custo de API externa)
- [react-markdown](https://github.com/remarkjs/react-markdown) para o conteúdo em Markdown do site
- Google Drive API (somente leitura) para hospedar as imagens do site

## Rodando localmente

Requer Node 24+ (veja `.nvmrc`).

```bash
npm install
npm run dev
```

### Variáveis de ambiente

Crie um `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_DRIVE_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API, no Supabase) é usada só pelo servidor MCP (`/api/mcp`) pra autenticar conexões pelo próprio token, sem depender da sessão de login do admin — bypassa RLS, nunca é exposta ao client e não é necessária pra rodar o resto do site.

### Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) e copie a URL e a chave anônima das configurações.
2. Aplique as migrações em `supabase/migrations/` (em ordem) pelo SQL Editor do projeto.
3. Crie o usuário administrador em **Authentication → Users**.

### Google Drive

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/), ative a **Google Drive API** e gere uma **API Key** restrita a essa API.
2. A pasta do Drive usada para as imagens do site precisa estar com permissão "qualquer pessoa com o link pode visualizar".
3. Configure a URL da pasta pelo painel admin, em Personalização.

## Testes e qualidade

```bash
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # testes unitários (test runner nativo do Node)
```

O workflow em `.github/workflows/ci.yml` roda essas três checagens e o build de produção em toda PR e a cada push. A branch `main` é protegida: só aceita merge com os checks passando, sem force-push nem deleção.

## Estrutura

```
app/          rotas e páginas (App Router)
components/   componentes React
lib/          lógica pura (ícones, SEO, etc.) — coberta por testes em lib/*.test.ts
supabase/     migrações do banco
```

## Busca

A busca (`/busca`, `⌘K`) combina dois motores independentes e funde os resultados:

1. **Full-text** — Postgres nativo. Cada item indexável (projeto, artigo, página) vira uma linha em `search_index`, com uma coluna `tsvector` gerada (`to_tsvector('portuguese', search_text)`) e um índice GIN. A busca usa `websearch_to_tsquery` (aceita frases entre aspas, `-exclusão`, `OU`) via a RPC `search_index_fulltext`, ordenando por `ts_rank`.
2. **Semântica** — cada linha também guarda um `embedding vector(384)` (extensão `pgvector`, índice HNSW com `vector_cosine_ops`). O texto do item e a query de busca são convertidos em vetores pelo modelo [`Xenova/paraphrase-multilingual-MiniLM-L12-v2`](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2) (multilíngue PT/EN, quantizado em `q8`), rodando **localmente no servidor** via `@huggingface/transformers` — sem chamada a API externa nem custo por busca. A RPC `match_search_index` ordena por distância de cosseno (`embedding <=> query_embedding`).

Os dois resultados (rankings de IDs, não scores comparáveis entre si) são combinados por **Reciprocal Rank Fusion** (`lib/search/rank.ts`): cada item recebe `1 / (k + posição + 1)` em cada lista em que aparece (`k = 60`, a constante usual do RRF) e as pontuações são somadas. Isso favorece itens bem colocados em qualquer um dos dois motores, sem precisar normalizar full-text rank e distância vetorial pra uma escala comum. Se a busca semântica falhar ou estourar o timeout, a rota usa só o resultado full-text (degradação graciosa).

Outros detalhes:

- **Rate limit por IP**, configurável pelo painel admin (Personalização → Busca): nº máx. de buscas por janela de tempo, tamanho máximo da query, timeout da busca semântica e nº de resultados retornados. Os defaults ficam em `app/api/search/route.ts`; requisições são logadas em `search_requests` pra contagem.
- **Reindexação**: ao salvar um projeto, artigo, tecnologia, "sobre" ou currículo pelo admin, a linha correspondente em `search_index` é recalculada na hora — texto e embedding juntos (`lib/supabase/search-index.ts`). O botão "Reindexar tudo" (Personalização) refaz esse processo pra todo o conteúdo, útil após uma mudança no modelo ou pra recuperar embeddings perdidos. O modelo é aquecido (`/api/search/warmup`) para reduzir a latência da primeira busca depois de um cold start.
- **Bundling na Vercel**: `@huggingface/transformers` e sua dependência `onnxruntime-node` usam binários nativos (`.node`) carregados por caminho calculado em runtime, que o file-tracing automático da Vercel não detecta sozinho. `next.config.ts` declara `outputFileTracingIncludes` explicitamente para as rotas `/admin/**` e `/api/search/**`, incluindo só os binários linux/x64 necessários (excluindo os providers CUDA/TensorRT, que sozinhos passam de 200MB).

## Conexões MCP

O painel admin (`/admin/mcp`) permite criar conexões [MCP](https://modelcontextprotocol.io) — cada uma gera um token de acesso pra um cliente de IA (Claude Desktop, Claude Code etc.) ler e editar o conteúdo do site em nome do dono, apontando pra `/api/mcp` com `Authorization: Bearer <token>`. Como alguns conectores (ex.: claude.ai) reservam o cabeçalho `Authorization` pro próprio fluxo OAuth e não deixam setar manualmente, o token também é aceito via `X-Auth-Token: <token>` (sem "Bearer").

- **Permissões por recurso**: cada conexão tem leitura/escrita configuráveis separadamente para Projetos (inclui empresas e vínculos), Artigos, Tecnologias, Autores, Currículo, Conteúdo do site (textos, SEO, personalização, links de contato) e Mensagens (recebidas pelo formulário de contato). Só as tools correspondentes às permissões concedidas ficam visíveis pro cliente MCP daquela conexão (`lib/mcp/tools.ts`).
- **Autenticação**: token opaco gerado na criação (`mcp_...`), mostrado uma única vez; só o hash SHA-256 fica salvo (`mcp_connections.token_hash`). Uma conexão pode ser renomeada, revogada/reativada ou removida a qualquer momento pelo painel.
- **Sem sessão de admin**: como o cliente MCP não faz login pelo Supabase Auth, o endpoint usa a service role (`SUPABASE_SERVICE_ROLE_KEY`, bypassa RLS) — a autorização real acontece na aplicação, checando a permissão da conexão antes de cada leitura/escrita, não no banco.
- **Implementação**: `@modelcontextprotocol/sdk`, transporte Streamable HTTP em modo stateless (um `McpServer` novo por request, sem estado entre invocações — compatível com o modelo serverless da Vercel). Escritas via MCP reindexam a busca do mesmo jeito que uma edição pelo admin.

## Fluxo de trabalho

Desenvolvimento acontece na branch `dev`; mudanças vão pra `main` (produção, com deploy automático na Vercel) via pull request, depois que o CI passa.

### Padrão de commits

Toda mensagem de commit segue `tipo: descrição` (ex: `feat: adiciona busca por empresa nos projetos`). Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`.

`npm install` já configura um hook local (`.githooks/commit-msg`) que rejeita commits fora do padrão; o CI faz a mesma checagem em toda PR, então não dá pra burlar com `--no-verify`.

## Deploy

O projeto está preparado para deploy na [Vercel](https://vercel.com/): conecte o repositório, configure as variáveis de ambiente acima e o deploy roda automaticamente a cada push na branch principal.

## Segurança

Encontrou uma vulnerabilidade? Veja [SECURITY.md](./SECURITY.md) antes de reportar.

## Licença

Distribuído sob MIT + Commons Clause — veja [LICENSE](./LICENSE). Uso, cópia, modificação e distribuição são livres, inclusive em produto fechado/privado; a única restrição é vender o software (ou um serviço cujo valor vem substancialmente dele) sem uma licença comercial separada.
