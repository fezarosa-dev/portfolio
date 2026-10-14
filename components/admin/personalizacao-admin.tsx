'use client'

import { useMemo } from 'react'
import { useChanges } from '@/components/admin/changes-provider'
import { SiteContentForm } from '@/components/admin/site-content-form'
import { overlaySiteContent } from '@/lib/changes/overlay'
import { siteChangesFromForm } from '@/lib/changes/site-form'

/** Personalização pela fila: o formulário parte do conteúdo + o que já está na fila e enfileira só as chaves que mudaram. */
export function PersonalizacaoAdmin({
  content,
  plainKeys,
  bilingualKeys,
}: {
  content: Record<string, string>
  plainKeys: string[]
  bilingualKeys: string[]
}) {
  const { changes, enqueue, loaded } = useChanges()
  const effective = useMemo(() => overlaySiteContent(content, changes), [content, changes])
  // remonta o formulário quando a fila de Personalização muda (ex.: depois de salvar ou revogar)
  const formKey = changes.filter((c) => c.op.type.startsWith('site.')).map((c) => c.id).join()

  if (!loaded) return null

  return (
    <SiteContentForm
      key={formKey}
      content={effective}
      onSubmit={(formData, initial) => {
        for (const { op, label } of siteChangesFromForm(formData, initial, effective, plainKeys, bilingualKeys)) enqueue(op, label)
      }}
    />
  )
}
