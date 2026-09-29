/** JSON pra dentro de <script type="application/ld+json">: escapa `<` pra `</script>` no conteúdo não fechar a tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
