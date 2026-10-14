import { parseBilingualEn, parseBilingualPt } from '../bilingual.ts'
import type { ArticleData, ProjectData } from './types.ts'

const text = (formData: FormData, name: string) => String(formData.get(name) ?? '') || null

export function projectDataFromForm(formData: FormData): ProjectData {
  return {
    title: parseBilingualPt(formData, 'title'),
    title_en: parseBilingualEn(formData, 'title'),
    summary: parseBilingualPt(formData, 'summary'),
    summary_en: parseBilingualEn(formData, 'summary'),
    content_md: parseBilingualPt(formData, 'content_md'),
    content_md_en: parseBilingualEn(formData, 'content_md'),
    repo_url: text(formData, 'repo_url'),
    site_url: text(formData, 'site_url'),
    click_mode: formData.get('click_mode') === 'link' ? 'link' : 'detail',
    click_url: text(formData, 'click_url'),
    company_id: text(formData, 'company_id'),
    position: Number(formData.get('position') ?? 0) || 0,
    visible: formData.get('visible') === 'true',
    show_on_home: formData.get('show_on_home') === 'true',
    in_resume: formData.get('in_resume') === 'true',
    resume_what: parseBilingualPt(formData, 'resume_what'),
    resume_what_en: parseBilingualEn(formData, 'resume_what'),
    resume_with: parseBilingualPt(formData, 'resume_with'),
    resume_with_en: parseBilingualEn(formData, 'resume_with'),
    resume_solves: parseBilingualPt(formData, 'resume_solves'),
    resume_solves_en: parseBilingualEn(formData, 'resume_solves'),
    language_ids: formData.getAll('language_ids').map(String),
    author_ids: formData.getAll('author_ids').map(String),
  }
}

export function articleDataFromForm(formData: FormData): ArticleData {
  return {
    title: parseBilingualPt(formData, 'title'),
    title_en: parseBilingualEn(formData, 'title'),
    summary: parseBilingualPt(formData, 'summary'),
    summary_en: parseBilingualEn(formData, 'summary'),
    content_md: parseBilingualPt(formData, 'content_md'),
    content_md_en: parseBilingualEn(formData, 'content_md'),
    position: Number(formData.get('position') ?? 0) || 0,
    visible: formData.get('visible') === 'true',
  }
}
