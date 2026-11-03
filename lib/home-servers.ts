/** Quantos projetos a home mostra: cada um vira um servidor na cena 3D (os que faltam ficam desligados). */
export const HOME_SERVERS = 4

/**
 * Aviso quando a home não tem exatamente HOME_SERVERS projetos (visíveis e marcados para a home). Não bloqueia nada:
 * com menos, sobram servidores desligados; com mais, só os primeiros aparecem.
 */
export function homeWarning(projects: { visible: boolean; show_on_home: boolean }[]): string | null {
  const n = projects.filter((p) => p.visible && p.show_on_home).length
  if (n < HOME_SERVERS)
    return `A tela inicial vai ficar incompleta: ${n} de ${HOME_SERVERS} projetos marcados para a home (${HOME_SERVERS - n} servidor(es) desligado(s)).`
  if (n > HOME_SERVERS) return `${n} projetos marcados para a home, mas ela mostra só ${HOME_SERVERS}: os ${n - HOME_SERVERS} últimos (pela ordem) ficam de fora.`
  return null
}
