import Link from 'next/link'
import { getResumeSource } from '@/lib/supabase/resume-queries'
import { getAllProjects } from '@/lib/supabase/admin-queries'
import { getLanguages } from '@/lib/supabase/queries'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { ResumeSection } from '@/components/admin/resume-section'
import { ResumeSkillsSection } from '@/components/admin/resume-skills-section'
import { saveProfile, toggleProject, moveProject } from './actions'

type Row = Record<string, unknown> & { id: string }
const asRows = (rows: unknown[]) => rows as Row[]

export default async function AutocurriculoPage() {
  const [source, projects, languages] = await Promise.all([getResumeSource(), getAllProjects(), getLanguages()])
  const profile = source.profile
  const inResume = projects.filter((p) => p.in_resume).sort((a, b) => a.resume_position - b.resume_position)
  const outOfResume = projects.filter((p) => !p.in_resume)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Autocurrículo</h1>
      <p className="mt-2 font-mono text-xs text-steel">
        o currículo da página pública e o PDF são gerados daqui. cada lista tem ordem própria (↑ ↓). contato e links vêm
        de Personalização.{' '}
        <Link href="/curriculo" target="_blank" className="text-signal underline">
          ver currículo
        </Link>
      </p>

      <section className="mt-8" id="perfil">
        <h2 className="text-lg font-semibold">Cabeçalho e resumo profissional</h2>
        <ToastForm action={saveProfile} successMessage="Perfil salvo" className="mt-3 grid gap-3 sm:grid-cols-2">
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
        </ToastForm>
      </section>

      <ResumeSection entity="experiences" rows={asRows(source.experiences)} companies={source.companies} />

      <section className="mt-10" id="projetos">
        <h2 className="text-lg font-semibold">Projetos no currículo</h2>
        <p className="mt-1 font-mono text-xs text-steel">
          marque os que entram. “O quê / Com quê / Resolve” se edita no próprio projeto (campos ocultos ao público).
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {inResume.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-hairline p-3 text-sm">
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
                <form action={moveProject.bind(null, p.id, -1)}>
                  <Button type="submit" variant="outline" size="sm" aria-label="Subir">
                    ↑
                  </Button>
                </form>
                <form action={moveProject.bind(null, p.id, 1)}>
                  <Button type="submit" variant="outline" size="sm" aria-label="Descer">
                    ↓
                  </Button>
                </form>
                <form action={toggleProject.bind(null, p.id, false)}>
                  <Button type="submit" variant="outline" size="sm">
                    remover
                  </Button>
                </form>
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
                  <form action={toggleProject.bind(null, p.id, true)}>
                    <Button type="submit" variant="outline" size="sm">
                      incluir
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <ResumeSection entity="education" rows={asRows(source.education)} />
      <ResumeSection entity="spoken" rows={asRows(source.spoken)} />
      <ResumeSkillsSection
        categories={source.categories}
        skills={source.skills}
        technologies={languages.map((l) => ({ id: l.id, name: l.name }))}
      />
      <ResumeSection entity="certifications" rows={asRows(source.certifications)} />
    </div>
  )
}
