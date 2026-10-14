'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { QueueForm } from '@/components/admin/queue-form'
import { ResumeSection } from '@/components/admin/resume-section'
import { ResumeSkillsSection } from '@/components/admin/resume-skills-section'
import { useChanges } from '@/components/admin/changes-provider'
import { overlayProjects, overlayResume, overlayResumeProjects, touchedIds } from '@/lib/changes/overlay'
import type { ResumeSource } from '@/lib/resume'
import type { Author, Company, Language, Project } from '@/lib/supabase/queries'

type Row = Record<string, unknown> & { id: string }
const asRows = (rows: unknown[]) => rows as Row[]

export function ResumeAdmin({
  source,
  projects,
  languages,
  authors,
  companies,
}: {
  source: ResumeSource
  projects: Project[]
  languages: Language[]
  authors: Author[]
  companies: Company[]
}) {
  const { changes, enqueue, loaded } = useChanges()
  const resume = useMemo(() => overlayResume(source, changes), [source, changes])
  const allProjects = useMemo(
    () => overlayResumeProjects(overlayProjects(projects, changes, { languages, authors, companies }), changes),
    [projects, changes, languages, authors, companies]
  )
  const touched = useMemo(() => touchedIds(changes, 'resume'), [changes])
  const hasProfileChange = changes.some((c) => c.op.type === 'resume.profile')

  if (!loaded) return null

  const profile = resume.profile
  const inResume = allProjects.filter((p) => p.in_resume).sort((a, b) => a.resume_position - b.resume_position)
  const outOfResume = allProjects.filter((p) => !p.in_resume)
  const inResumeIds = inResume.map((p) => p.id)

  function saveProfile(formData: FormData) {
    const text = (name: string) => String(formData.get(name) ?? '').trim() || null
    enqueue(
      {
        type: 'resume.profile',
        values: {
          full_name: text('full_name'),
          headline: text('headline'),
          headline_en: text('headline_en'),
          location: text('location'),
          location_en: text('location_en'),
          summary: text('summary'),
          summary_en: text('summary_en'),
        },
      },
      'Currículo: cabeçalho e resumo'
    )
  }

  function moveProject(id: string, direction: -1 | 1) {
    const index = inResumeIds.indexOf(id)
    const to = index + direction
    if (index < 0 || to < 0 || to >= inResumeIds.length) return
    const ids = [...inResumeIds]
    ;[ids[index], ids[to]] = [ids[to], ids[index]]
    enqueue({ type: 'resume.projectOrder', ids }, 'Currículo: nova ordem dos projetos')
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Currículo</h1>
      <p className="mt-2 font-mono text-xs text-steel">
        o currículo da página pública e o PDF são gerados daqui. cada lista tem ordem própria (↑ ↓). contato e links vêm
        de Personalização.{' '}
        <Link href="/curriculo" target="_blank" className="text-signal underline">
          ver currículo
        </Link>
      </p>

      <section className="mt-8" id="perfil">
        <h2 className="text-lg font-semibold">Cabeçalho e resumo profissional</h2>
        <QueueForm
          key={JSON.stringify(profile)}
          onSubmit={saveProfile}
          className={`mt-3 grid gap-3 rounded-lg border p-3 sm:grid-cols-2 ${hasProfileChange ? 'border-orange-500' : 'border-transparent'}`}
        >
          <div>
            <Label htmlFor="full_name">Nome</Label>
            <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} />
          </div>
          <div>
            <Label htmlFor="headline">Título (ex.: Software Engineer)</Label>
            <Input id="headline" name="headline" defaultValue={profile?.headline ?? ''} />
            <Input name="headline_en" aria-label="Título (EN)" placeholder="EN (opcional)" defaultValue={profile?.headline_en ?? ''} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="location">Localização</Label>
            <Input id="location" name="location" defaultValue={profile?.location ?? ''} />
            <Input name="location_en" aria-label="Localização (EN)" placeholder="EN (opcional)" defaultValue={profile?.location_en ?? ''} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="summary">Resumo profissional</Label>
            <Textarea id="summary" name="summary" rows={5} defaultValue={profile?.summary ?? ''} />
            <Textarea name="summary_en" aria-label="Resumo (EN)" rows={5} placeholder="EN (opcional — vazio usa o PT)" defaultValue={profile?.summary_en ?? ''} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">
              Salvar
            </Button>
          </div>
        </QueueForm>
      </section>

      <ResumeSection entity="experiences" rows={asRows(resume.experiences)} companies={companies} touched={touched} />

      <section className="mt-10" id="projetos">
        <h2 className="text-lg font-semibold">Projetos no currículo</h2>
        <p className="mt-1 font-mono text-xs text-steel">
          marque os que entram. “O quê / Com quê / Resolve” se edita no próprio projeto (campos ocultos ao público).
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {inResume.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${touched.has(p.id) ? 'border-orange-500' : 'border-hairline'}`}
            >
              <span className="min-w-0 truncate">
                {p.title ?? p.title_en}
                {!p.resume_what && !p.resume_with && !p.resume_solves && (
                  <span className="ml-2 font-mono text-xs text-destructive">sem O quê/Com quê/Resolve</span>
                )}
              </span>
              <div className="flex gap-1">
                <Link href={`/admin/projetos/${p.id}`} className="inline-flex h-8 items-center rounded-md border border-hairline px-2.5 text-xs">
                  editar
                </Link>
                <Button type="button" variant="outline" size="sm" aria-label="Subir" onClick={() => moveProject(p.id, -1)}>
                  ↑
                </Button>
                <Button type="button" variant="outline" size="sm" aria-label="Descer" onClick={() => moveProject(p.id, 1)}>
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => enqueue({ type: 'resume.project', id: p.id, inResume: false }, `Currículo: tirar projeto “${p.title ?? p.title_en}”`)}
                >
                  remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {outOfResume.length > 0 && (
          <details className="mt-3 rounded-lg border border-dashed border-hairline p-3">
            <summary className="cursor-pointer font-mono text-xs text-signal">+ incluir projeto ({outOfResume.length})</summary>
            <ul className="mt-3 flex flex-col gap-1.5">
              {outOfResume.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{p.title ?? p.title_en}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => enqueue({ type: 'resume.project', id: p.id, inResume: true }, `Currículo: incluir projeto “${p.title ?? p.title_en}”`)}
                  >
                    incluir
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <ResumeSection entity="education" rows={asRows(resume.education)} touched={touched} />
      <ResumeSection entity="spoken" rows={asRows(resume.spoken)} touched={touched} />
      <ResumeSkillsSection
        categories={resume.categories}
        skills={resume.skills}
        technologies={languages.map((l) => ({ id: l.id, name: l.name }))}
        touched={touched}
      />
      <ResumeSection entity="certifications" rows={asRows(resume.certifications)} touched={touched} />
    </div>
  )
}
