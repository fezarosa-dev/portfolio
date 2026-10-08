// Links escondidos do menu: os marcados em Personalização > Navegação + /tecnologias quando a página está desativada.
export function hiddenNavLinks(content: Record<string, string>): Set<string> {
  const hidden = new Set(
    (content.nav_hidden_links ?? '')
      .split(',')
      .map((href) => href.trim())
      .filter(Boolean)
  )
  if (content.tecnologias_ativo === 'false') hidden.add('/tecnologias')
  return hidden
}
