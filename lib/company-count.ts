import type { Project } from './supabase/queries.ts'

/**
 * Quantos clientes/empresas os projetos representam: projeto num grupo de cliente conta pelo grupo; projeto sem
 * grupo conta pela empresa dele (todos os pessoais juntos somam um, todos os freelas sem grupo somam um).
 * Projeto sem empresa não conta.
 */
export function countClients(projects: Pick<Project, 'client_id' | 'company'>[]): number {
  return new Set(projects.flatMap((p) => (p.client_id ? [`client:${p.client_id}`] : p.company ? [`company:${p.company.id}`] : []))).size
}
