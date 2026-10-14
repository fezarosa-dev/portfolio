import { PAGE_TEXTS } from '@/lib/page-texts'
import { SEO_PAGE_KEYS } from '@/lib/seo'

/** Páginas que aparecem no menu (valores de nav_hidden_links). */
export const NAV_PAGES = ['/', '/sobre', '/servicos', '/projetos', '/tecnologias', '/artigos', '/contato', '/curriculo'] as const

/** Template geral do site pra IAs: o que existe, qual tool edita e como mostrar/esconder cada coisa. */
export function buildSiteTemplate(): string {
  const seoPages = ['home', ...SEO_PAGE_KEYS].join(', ')
  const pageTexts = PAGE_TEXTS.map((t) => `- ${t.key} (+ ${t.key}_en) — ${t.page}: ${t.label}`).join('\n')
  return `# Template do site (guia geral do MCP do zanoni.dev.br)

Regras: PT obrigatório, *_en opcional (vazio cai pro PT). Rode sempre o list_*/read_* antes de editar pra reaproveitar ids. Texto factual, sem marketing, sem inventar dados. Mudanças aparecem no site na hora (o cache é invalidado a cada escrita).
Templates específicos: get_template_projeto (projetos) e get_template_curriculo (currículo).

## Mostrar / esconder (visibilidade)
- Projeto: set_visibilidade { entity: "projeto", id, visible, show_on_home } — visible=false tira da lista pública e da busca; show_on_home destaca na home.
- Artigo: set_visibilidade { entity: "artigo", id, visible }.
- Tecnologia: set_visibilidade { entity: "tecnologia", id, show_on_home } — se aparece na home.
- Projeto no currículo: set_projeto_no_curriculo { id, in_resume }.
- Páginas e recursos do site: set_visibilidade_site
  - menu_oculto: lista de páginas escondidas do menu (a página continua existindo). Valores: ${NAV_PAGES.join(', ')}. A lista enviada SUBSTITUI a atual; [] mostra tudo.
  - pagina_tecnologias: false desativa a página /tecnologias (404 + fora do sitemap e do menu).
  - easter_eggs: liga/desliga todos os easter eggs de teclado.
  - mascote: mostra/esconde o mascote.

## Artigos — upsert_artigo
{ "title": "Título", "summary": "Resumo de 1–2 frases", "content_md": "# Markdown…", "visible": true } (+ title_en, summary_en, content_md_en). Imagens só por nome de arquivo da pasta do Drive.

## Tecnologias
- upsert_tecnologia { name, icon_url?, category_id?, show_on_home? } — o ícone é achado pelo nome (devicon). ordenar_tecnologias { ordered_ids } define a ordem de exibição.
- upsert_categoria_tecnologia { name, name_en } / mover_categoria_tecnologia { id, direction: -1|1 }.

## Autores e empresas
- upsert_autor { name, url? }; upsert_empresa { name, name_en?, url? }. Reaproveite os existentes.

## Contato
- upsert_link_contato { label, label_en?, url }; ordenar_links_contato { ordered_ids }; delete_link_contato.
- Email, telefone, GitHub e LinkedIn: set_conteudo_site com as chaves contato_email, contato_telefone, link_github, link_linkedin.

## Mensagens
- list_mensagens, marcar_mensagem_lida { id, read }, delete_mensagem.

## Textos e configuração — set_conteudo_site { key, value } (read_conteudo_site lista tudo; delete_chave_conteudo_site volta ao padrão)
- Hero: hero_title, hero_subtitle (+ _en), ${PAGE_TEXTS.find((t) => t.page === 'home')?.key}
- Páginas: sobre_texto, servicos_texto, status_text, como_usar_texto, privacidade_texto, termos_texto, cookies_texto (+ _en; Markdown)
- Textos editáveis por página:
${pageTexts}
- SEO: seo_<página>_title, seo_<página>_description (+ _en) para as páginas: ${seoPages}; seo_home_keywords (+ _en)
- Identidade: site_icon, sobre_foto (nome de arquivo do Drive), drive_folder_url, status_color
- Busca: search_rate_limit_max, search_rate_limit_window_minutes, search_max_query_length, search_semantic_timeout_ms, search_results_limit
- Flags: easter_eggs_ativo, tecnologias_ativo, mascote_ativo ("true"/"false" — prefira set_visibilidade_site), nav_hidden_links (CSV)
`
}
