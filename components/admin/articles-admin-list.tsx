'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayArticles, touchedIds } from '@/lib/changes/overlay'
import type { Article } from '@/lib/supabase/queries'

export function ArticlesAdminList({ articles }: { articles: Article[] }) {
  const { changes, enqueue } = useChanges()
  const list = useMemo(() => overlayArticles(articles, changes), [articles, changes])
  const touched = useMemo(() => touchedIds(changes, 'article'), [changes])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Artigos</h1>
        <Button render={<Link href="/admin/artigos/novo" />}>Novo artigo</Button>
      </div>

      <p className="mb-6 font-mono text-xs text-steel">
        pra esconder &quot;Artigos&quot; do menu do site sem apagar nada, use a aba{' '}
        <Link href="/admin/personalizacao" className="text-signal hover:underline">
          Personalização → Navegação
        </Link>
        .
      </p>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum artigo ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-card font-mono text-xs text-steel">
              <tr>
                <th className="px-4 py-3 font-normal">Título</th>
                <th className="px-4 py-3 font-normal">Visível</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((article) => {
                const title = article.title ?? article.title_en ?? 'sem título'
                return (
                  <tr
                    key={article.id}
                    className={`border-t border-hairline ${touched.has(article.id) ? 'outline outline-1 -outline-offset-1 outline-orange-500' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{article.title}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          enqueue(
                            { type: 'article.visible', id: article.id, visible: !article.visible },
                            `Artigo “${title}”: ${article.visible ? 'ocultar' : 'mostrar'}`
                          )
                        }
                        className={article.visible ? 'font-mono text-xs text-status' : 'font-mono text-xs text-steel'}
                      >
                        {article.visible ? '● visível' : '○ oculto'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-4">
                        <Link href={`/admin/artigos/${article.id}`} className="text-signal hover:underline">
                          editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => enqueue({ type: 'article.remove', id: article.id }, `Artigo “${title}”: excluir`)}
                          className="text-destructive hover:underline"
                        >
                          excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
