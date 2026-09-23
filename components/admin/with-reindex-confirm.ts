/** Pergunta (confirm nativo do navegador) se a mudança deve atualizar a busca agora,
 * e grava a resposta no FormData pra a server action decidir se reindexar. */
export function withReindexConfirm(formData: FormData): FormData {
  const shouldReindex = window.confirm(
    'Atualizar a busca com essa mudança agora? (recalcula o texto pesquisável e o embedding)'
  )
  formData.set('reindex', shouldReindex ? 'true' : 'false')
  return formData
}
