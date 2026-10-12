import { RESUME_LABELS, type Resume } from '@/lib/resume'
import type { Locale } from '@/lib/i18n/dictionaries'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="border-b border-hairline pb-1 font-mono text-xs uppercase tracking-wide text-signal">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-foreground/90 marker:text-steel">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/** Currículo estruturado na página pública — mesma fonte (buildResume) do PDF. */
export function ResumeView({ resume, locale }: { resume: Resume; locale: Locale }) {
  const L = RESUME_LABELS[locale]
  return (
    <div>
      {resume.summary && (
        <Section title={L.summary}>
          <p className="text-sm leading-relaxed text-foreground/90">{resume.summary}</p>
        </Section>
      )}

      {resume.experiences.length > 0 && (
        <Section title={L.experience}>
          <div className="flex flex-col gap-6">
            {resume.experiences.map((e) => (
              <article key={`${e.title}-${e.range}`}>
                <h3 className="font-medium">
                  {e.title}
                  {e.company && <span className="font-normal text-steel"> — {e.company}</span>}
                </h3>
                <p className="font-mono text-xs text-steel">{e.range}</p>
                {e.topics.length > 0 && <Bullets items={e.topics} />}
              </article>
            ))}
          </div>
        </Section>
      )}

      {resume.projects.length > 0 && (
        <Section title={L.projects}>
          <div className="flex flex-col gap-6">
            {resume.projects.map((p) => (
              <article key={p.title}>
                <h3 className="font-medium">{p.title}</h3>
                <Bullets
                  items={[
                    p.what && (
                      <>
                        <strong>{L.what}:</strong> {p.what}
                      </>
                    ),
                    p.with && (
                      <>
                        <strong>{L.with}:</strong> {p.with}
                      </>
                    ),
                    p.solves && (
                      <>
                        <strong>{L.solves}:</strong> {p.solves}
                      </>
                    ),
                  ].filter(Boolean)}
                />
              </article>
            ))}
          </div>
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title={L.education}>
          <Bullets
            items={resume.education.map((e) => (
              <>
                <strong>{e.degree}</strong>
                {[e.institution, e.year].filter(Boolean).map((part) => ` – ${part}`)}
              </>
            ))}
          />
        </Section>
      )}

      {resume.spoken.length > 0 && (
        <Section title={L.languages}>
          <p className="text-sm">{resume.spoken.map((s) => [s.language, s.level].filter(Boolean).join(' – ')).join('  |  ')}</p>
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title={L.skills}>
          <dl className="flex flex-col gap-2 text-sm">
            {resume.skills.map((c) => (
              <div key={c.category}>
                <dt className="inline font-medium">{c.category}: </dt>
                <dd className="inline text-foreground/90">{c.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {resume.certifications.length > 0 && (
        <Section title={L.certifications}>
          <Bullets items={resume.certifications.map((c) => [c.name, c.range].filter(Boolean).join(' – '))} />
        </Section>
      )}
    </div>
  )
}
