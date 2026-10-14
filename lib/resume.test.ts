import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildResume, formatDate, formatRange, splitLines, type ResumeSource } from './resume.ts'

test('formatDate usa mês+ano ou só o ano', () => {
  assert.equal(formatDate(2026, 5, 'pt'), 'Mai 2026')
  assert.equal(formatDate(2026, 5, 'en'), 'May 2026')
  assert.equal(formatDate(2023, null, 'pt'), '2023')
})

test('formatRange: experiência sem fim vira Atual; certificação sem fim mostra só o início', () => {
  assert.equal(formatRange({ year: 2026, month: 5 }, { year: null, month: null }, 'pt', 'Atual'), 'Mai 2026 – Atual')
  assert.equal(formatRange({ year: 2025, month: 1 }, { year: null, month: null }, 'pt'), 'Jan 2025')
  assert.equal(formatRange({ year: 2023, month: null }, { year: 2024, month: null }, 'pt'), '2023 – 2024')
  assert.equal(formatRange({ year: 2022, month: null }, { year: 2023, month: null }, 'pt', undefined, '–'), '2022–2023')
})

test('splitLines ignora vazias e marcadores', () => {
  assert.deepEqual(splitLines('- a;\n\n• b\r\n  c '), ['a;', 'b', 'c'])
})

const src: ResumeSource = {
  profile: { full_name: 'Fulano', headline: 'Dev', headline_en: null, location: 'BR', location_en: null, summary: 'Resumo', summary_en: 'Summary' },
  contact: { email: 'a@b.c', phone: '1', links: ['x.dev'] },
  experiences: [
    { id: '2', company_id: 'c1', role: 'B', role_en: null, start_year: 2024, start_month: null, end_year: 2025, end_month: null, topics: 'um\ndois', topics_en: null, position: 1 },
    { id: '1', company_id: 'c1', role: 'A', role_en: null, start_year: 2026, start_month: 1, end_year: null, end_month: null, topics: null, topics_en: null, position: 0 },
  ],
  companies: [{ id: 'c1', name: 'Acme', name_en: null }],
  projects: [],
  education: [],
  spoken: [],
  categories: [
    { id: 'k1', name: 'Vazia', name_en: null, position: 0 },
    { id: 'k2', name: 'Langs', name_en: null, position: 1 },
  ],
  skills: [
    { id: 's2', category_id: 'k2', language_id: null, label: 'Custom', label_en: null, position: 1 },
    { id: 's1', category_id: 'k2', language_id: 'l1', label: null, label_en: null, position: 0 },
  ],
  technologies: { l1: { name: 'Rust', name_en: null }, l2: { name: 'Banco de dados', name_en: 'Database' } },
  certifications: [],
}

test('buildResume respeita a ordem, resolve empresa/tecnologia e esconde categoria vazia', () => {
  const r = buildResume(src, 'pt')
  assert.deepEqual(r.experiences.map((e) => e.title), ['A', 'B'])
  assert.equal(r.experiences[0].company, 'Acme')
  assert.equal(r.experiences[0].range, 'Jan 2026 – Atual')
  assert.deepEqual(r.experiences[1].topics, ['um', 'dois'])
  assert.deepEqual(r.skills, [{ category: 'Langs', items: ['Rust', 'Custom'] }])
  assert.deepEqual(r.contactLines, ['BR  |  1  |  a@b.c', 'x.dev'])
  assert.equal(buildResume(src, 'en').summary, 'Summary')
})

test('tecnologia usa o nome do idioma (EN vazio cai pro PT) e "Com quê" vem das tecnologias vinculadas por id', () => {
  const withTechs: ResumeSource = {
    ...src,
    skills: [{ id: 's3', category_id: 'k2', language_id: 'l2', label: null, label_en: null, position: 0 }],
    projects: [
      { id: 'p1', title: 'P', title_en: null, resume_what: null, resume_what_en: null, resume_with: null, resume_with_en: null, resume_solves: null, resume_solves_en: null, resume_position: 0, project_languages: [{ language_id: 'l1' }, { language_id: 'l2' }] },
      { id: 'p2', title: 'Q', title_en: null, resume_what: null, resume_what_en: null, resume_with: 'texto próprio', resume_with_en: null, resume_solves: null, resume_solves_en: null, resume_position: 1, project_languages: [{ language_id: 'l1' }] },
    ],
  }
  assert.deepEqual(buildResume(withTechs, 'pt').skills[0].items, ['Banco de dados'])
  assert.deepEqual(buildResume(withTechs, 'en').skills[0].items, ['Database'])
  assert.deepEqual(buildResume(withTechs, 'pt').projects.map((p) => p.with), ['Rust, Banco de dados', 'texto próprio'])
  assert.deepEqual(buildResume(withTechs, 'en').projects.map((p) => p.with), ['Rust, Database', 'texto próprio'])
})
