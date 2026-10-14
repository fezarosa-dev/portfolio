'use client'

import { useMemo } from 'react'
import { useChanges } from '@/components/admin/changes-provider'
import { ArticleForm } from '@/components/admin/article-form'
import { overlayArticles } from '@/lib/changes/overlay'
import type { ArticleData } from '@/lib/changes/types'
import type { Article } from '@/lib/supabase/queries'

/** Cria (id = null) ou edita um artigo pela fila; a edição enxerga o que já está na fila. */
export function ArticleEditor({ id, articles }: { id: string | null; articles: Article[] }) {
  const { changes, enqueue, loaded } = useChanges()
  const article = useMemo(() => (id ? overlayArticles(articles, changes).find((a) => a.id === id) ?? null : null), [id, articles, changes])
  const newId = useMemo(() => crypto.randomUUID(), [])

  if (!loaded) return null
  if (id && !article) return <p className="text-sm text-muted-foreground">Artigo não encontrado.</p>

  function handleSubmit(data: ArticleData) {
    const title = data.title ?? data.title_en ?? 'sem título'
    const pendingCreate = !id || changes.some((c) => c.op.type === 'article.add' && c.op.id === id)
    enqueue(
      { type: id ? 'article.update' : 'article.add', id: id ?? newId, data },
      pendingCreate ? `Novo artigo “${title}”` : `Artigo “${title}”: editar`
    )
  }

  return <ArticleForm key={article?.id ?? 'novo'} article={article} onSubmit={handleSubmit} />
}
