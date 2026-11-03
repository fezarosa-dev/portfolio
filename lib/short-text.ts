/**
 * As primeiras frases de um texto que cabem em `max` caracteres (corta sempre no fim de uma frase). Se nem a primeira
 * frase cabe, corta na última palavra inteira e põe reticências.
 */
export function firstSentences(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  // fim de frase = pontuação seguida de espaço ("1.5" não quebra)
  const sentences = clean.split(/(?<=[.!?])\s+/)
  let out = ''
  for (const s of sentences) {
    if ((out ? `${out} ${s}` : s).length > max) break
    out = out ? `${out} ${s}` : s
  }
  if (out.trim()) return out.trim()
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).replace(/[,;:\s]+$/, '')}…`
}
