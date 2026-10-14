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
import { projectDataFromForm } from '@/lib/changes/forms'
import type { ProjectData } from '@/lib/changes/types'
import { iconUrl } from '@/lib/icons'
import type { Project, Language, Author, Company } from '@/lib/supabase/queries'

export function ProjectForm({
  project,
  availableLanguages,
  availableAuthors,
  availableCompanies,
  onSubmit,
}: {
  project: Project | null
  availableLanguages: Language[]
  availableAuthors: Author[]
  availableCompanies: Company[]
  onSubmit: (data: ProjectData) => void
}) {
  const router = useRouter()
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')
  const [clickMode, setClickMode] = useState<'detail' | 'link'>(project?.click_mode ?? 'detail')
  const [visible, setVisible] = useState(project?.visible ?? true)
  const [showOnHome, setShowOnHome] = useState(project?.show_on_home ?? false)
  const [inResume, setInResume] = useState(project?.in_resume ?? false)
  const selectedLanguageIds = new Set(project?.languages.map((l) => l.id) ?? [])
  const selectedAuthorIds = new Set(project?.authors.map((a) => a.id) ?? [])

  function handleSubmit(formData: FormData) {
    onSubmit(projectDataFromForm(formData))
    toast.success('Projeto na lista de mudanças')
    router.push('/admin/projetos')
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <LanguageToggle language={language} onChange={setLanguage} />

      <BilingualField
        name="title"
        label="Título"
        language={language}
        defaultValuePt={project?.title}
        defaultValueEn={project?.title_en}
      />

      <BilingualField
        name="summary"
        label="Resumo"
        language={language}
        defaultValuePt={project?.summary}
        defaultValueEn={project?.summary_en}
        multiline
        rows={2}
      />

      <BilingualField
        name="content_md"
        label="Conteúdo (Markdown)"
        language={language}
        defaultValuePt={project?.content_md}
        defaultValueEn={project?.content_md_en}
        multiline
        rows={12}
      />

      <div>
        <Label>Tecnologias</Label>
        {availableLanguages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma cadastrada ainda — adicione em Tecnologias.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3 rounded-md border p-3">
            {availableLanguages.map((lang) => (
              <label key={lang.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="language_ids"
                  value={lang.id}
                  defaultChecked={selectedLanguageIds.has(lang.id)}
                />
                {lang.devicon_slug && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl(lang.devicon_slug, lang.devicon_variant ?? 'plain', lang.icon_source)}
                    alt=""
                    className="h-4 w-4"
                  />
                )}
                {lang.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Autores</Label>
        {availableAuthors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum cadastrado ainda — adicione em Autores.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3 rounded-md border p-3">
            {availableAuthors.map((author) => (
              <label key={author.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="author_ids"
                  value={author.id}
                  defaultChecked={selectedAuthorIds.has(author.id)}
                />
                {author.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="company_id">Empresa</Label>
        {availableCompanies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma cadastrada ainda — adicione em Empresas.
          </p>
        ) : (
          <select
            id="company_id"
            name="company_id"
            defaultValue={project?.company?.id ?? ''}
            className="w-full rounded border p-2"
          >
            <option value="">Nenhuma</option>
            {availableCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name ?? company.name_en}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <Label htmlFor="repo_url">Link do repositório</Label>
        <Input id="repo_url" name="repo_url" defaultValue={project?.repo_url ?? ''} />
      </div>

      <div>
        <Label htmlFor="site_url">Link do site</Label>
        <Input id="site_url" name="site_url" defaultValue={project?.site_url ?? ''} />
      </div>

      <div>
        <Label htmlFor="click_mode">Ao clicar, abrir</Label>
        <select
          id="click_mode"
          name="click_mode"
          value={clickMode}
          onChange={(e) => setClickMode(e.target.value as 'detail' | 'link')}
          className="w-full rounded border p-2"
        >
          <option value="detail">Página do projeto (Markdown)</option>
          <option value="link">Link externo</option>
        </select>
      </div>

      {clickMode === 'link' && (
        <div>
          <Label htmlFor="click_url">Link de destino</Label>
          <Input id="click_url" name="click_url" defaultValue={project?.click_url ?? ''} required />
        </div>
      )}

      <div>
        <Label htmlFor="position">Ordem</Label>
        <Input id="position" name="position" type="number" defaultValue={project?.position ?? 0} />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
        <input type="hidden" name="visible" value={visible ? 'true' : 'false'} />
        <Label htmlFor="visible">Visível no site</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="show_on_home" checked={showOnHome} onCheckedChange={setShowOnHome} />
        <input type="hidden" name="show_on_home" value={showOnHome ? 'true' : 'false'} />
        <Label htmlFor="show_on_home">Aparecer na tela inicial</Label>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-hairline p-4">
        <legend className="px-1 font-mono text-xs text-steel">currículo — não aparece no site</legend>
        <div className="flex items-center gap-2">
          <Switch id="in_resume" checked={inResume} onCheckedChange={setInResume} />
          <input type="hidden" name="in_resume" value={inResume ? 'true' : 'false'} />
          <Label htmlFor="in_resume">Incluir no currículo</Label>
        </div>
        <BilingualField
          name="resume_what"
          label="O quê"
          language={language}
          defaultValuePt={project?.resume_what}
          defaultValueEn={project?.resume_what_en}
          multiline
          rows={2}
        />
        <BilingualField
          name="resume_with"
          label="Com quê"
          language={language}
          defaultValuePt={project?.resume_with}
          defaultValueEn={project?.resume_with_en}
          multiline
          rows={2}
        />
        <BilingualField
          name="resume_solves"
          label="Resolve"
          language={language}
          defaultValuePt={project?.resume_solves}
          defaultValueEn={project?.resume_solves_en}
          multiline
          rows={2}
        />
      </fieldset>

      <Button type="submit">Salvar</Button>
    </form>
  )
}
