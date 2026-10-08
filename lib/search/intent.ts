// Entende o pedido em linguagem natural antes de ir pro índice: tira as palavras genéricas
// ("projetos com python" -> "python") e detecta nomes de tecnologias cadastradas.

const FILLER = new Set(
  (
    'projeto projetos project projects artigo artigos article articles com usando usa usam use que qual quais ' +
    'em de do da dos das no na nos nas feito feitos feita feitas made built with using in on for the a o as os um uma ' +
    'e and meu meus minha minhas my todos todas all sobre about mostre mostrar me mostra show quero ver tenho'
  ).split(' ')
)

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function tokens(query: string): string[] {
  return normalize(query).split(/[^a-z0-9#+.]+/).filter(Boolean)
}

/** Query sem as palavras genéricas; se sobrar nada, devolve a original. */
export function cleanQuery(query: string): string {
  const kept = tokens(query).filter((token) => !FILLER.has(token))
  return kept.length ? kept.join(' ') : query
}

export function wantsProjects(query: string): boolean {
  return tokens(query).some((token) => ['projeto', 'projetos', 'project', 'projects'].includes(token))
}

/** Tecnologias cujo nome aparece como palavra inteira na query (c#, node.js e c não casam com "css"). */
export function matchTechs<T extends { name: string }>(query: string, techs: T[]): T[] {
  const padded = ` ${tokens(query).join(' ')} `
  return techs.filter((tech) => padded.includes(` ${normalize(tech.name).trim()} `))
}
