'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { LanguageToggle } from '@/components/admin/language-toggle'
import { BilingualField } from '@/components/admin/bilingual-field'
import type { Article } from '@/lib/supabase/queries'

export function ArticleForm({
  article,
  action,
}: {
  article: Article | null
  action: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')
  const [visible, setVisible] = useState(article?.visible ?? true)

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData)
      toast.success('Artigo salvo')
      router.push('/admin/artigos')
    } catch {
      toast.error('Não deu pra salvar o artigo. Tenta de novo.')
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {article && <input type="hidden" name="id" value={article.id} />}

      <LanguageToggle language={language} onChange={setLanguage} />

      <BilingualField
        name="title"
        label="Título"
        language={language}
        defaultValuePt={article?.title}
        defaultValueEn={article?.title_en}
      />

      <BilingualField
        name="summary"
        label="Resumo"
        language={language}
        defaultValuePt={article?.summary}
        defaultValueEn={article?.summary_en}
        multiline
        rows={2}
      />

      <BilingualField
        name="content_md"
        label="Conteúdo (Markdown)"
        language={language}
        defaultValuePt={article?.content_md}
        defaultValueEn={article?.content_md_en}
        multiline
        rows={16}
      />

      <div>
        <Label htmlFor="position">Ordem</Label>
        <Input id="position" name="position" type="number" defaultValue={article?.position ?? 0} />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
        <input type="hidden" name="visible" value={visible ? 'true' : 'false'} />
        <Label htmlFor="visible">Visível no site</Label>
      </div>

      <Button type="submit">Salvar</Button>
    </form>
  )
}
