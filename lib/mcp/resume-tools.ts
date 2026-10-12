import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getResumeSource } from '@/lib/supabase/resume-queries'
import {
  RESUME_TABLES,
  saveResumeItem,
  deleteResumeItem,
  moveResumeItem,
  saveResumeProfile,
  setProjectInResume,
  moveProjectInResume,
  type ResumeEntity,
} from '@/lib/supabase/resume-admin'
import { canRead, canWrite, type McpPermissions } from './resources'

/** Colunas que a IA pode escrever em cada lista (o resto, como id/position, é ignorado de propósito). */
const ALLOWED: Record<ResumeEntity, readonly string[]> = {
  experiences: ['company_id', 'role', 'role_en', 'start_year', 'start_month', 'end_year', 'end_month', 'topics', 'topics_en'],
  education: ['degree', 'degree_en', 'institution', 'institution_en', 'year'],
  spoken: ['language', 'language_en', 'level', 'level_en'],
  certifications: ['name', 'name_en', 'start_year', 'start_month', 'end_year', 'end_month'],
  skill_categories: ['name', 'name_en'],
  skills: ['category_id', 'language_id', 'label', 'label_en'],
}

const ENTITY_HELP = `entity e campos de "values":
- experiences: company_id (uuid de empresa), role, role_en, start_year*, start_month (1-12), end_year, end_month (fim vazio = emprego atual), topics e topics_en (um tópico por linha)
- education: degree, degree_en, institution, institution_en, year (texto livre, ex.: "2023 a 2025")
- spoken: language, language_en, level, level_en (idiomas falados)
- certifications: name, name_en, start_year, start_month, end_year, end_month (só o ano é permitido; sem fim mostra só o início)
- skill_categories: name, name_en
- skills: category_id*, e language_id (uuid de tecnologia) OU label/label_en (habilidade que não é tecnologia)
Textos: PT obrigatório, *_en opcional (vazio cai pro PT).`

const entitySchema = z.enum(Object.keys(RESUME_TABLES) as [ResumeEntity, ...ResumeEntity[]])
const valuesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]))

function textResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] }
}

/** Autocurrículo: leitura e edição do currículo estruturado (permissão "autocurriculo"). */
export function registerResumeTools(server: McpServer, permissions: McpPermissions, client: SupabaseClient): void {
  if (canRead(permissions, 'autocurriculo')) {
    server.registerTool(
      'read_autocurriculo',
      {
        title: 'Ler autocurrículo',
        description:
          'Retorna o currículo estruturado: perfil, experiências, formação, idiomas, categorias/habilidades, certificações e os projetos marcados no currículo (com ids e ordem).',
      },
      async () => textResult(await getResumeSource(client))
    )
  }

  if (!canWrite(permissions, 'autocurriculo')) return

  server.registerTool(
    'set_perfil_curriculo',
    {
      title: 'Editar cabeçalho e resumo do currículo',
      description: 'Campos omitidos não mudam. Contato e links vêm do conteúdo do site, não daqui.',
      inputSchema: {
        full_name: z.string().optional(),
        headline: z.string().optional().describe('Ex.: Software Engineer'),
        headline_en: z.string().optional(),
        location: z.string().optional(),
        location_en: z.string().optional(),
        summary: z.string().optional().describe('Resumo profissional (PT)'),
        summary_en: z.string().optional(),
      },
    },
    async (input) => {
      await saveResumeProfile(input as Record<string, string | null>, client)
      return textResult({ saved: Object.keys(input) })
    }
  )

  server.registerTool(
    'upsert_item_curriculo',
    {
      title: 'Criar ou editar item do currículo',
      description: `Cria (sem id) ou edita (com id) um item de lista do currículo. Novos itens entram no fim da ordem.\n${ENTITY_HELP}`,
      inputSchema: {
        entity: entitySchema,
        id: z.string().uuid().optional().describe('Omitir para criar'),
        values: valuesSchema,
      },
    },
    async ({ entity, id, values }) => {
      const unknown = Object.keys(values).filter((key) => !ALLOWED[entity].includes(key))
      if (unknown.length) throw new Error(`campos inválidos para ${entity}: ${unknown.join(', ')}. Permitidos: ${ALLOWED[entity].join(', ')}`)
      const scope = entity === 'skills' && typeof values.category_id === 'string' ? { column: 'category_id', value: values.category_id } : undefined
      if (entity === 'skills' && !id && !values.language_id && !values.label) throw new Error('habilidade precisa de language_id ou label')
      await saveResumeItem(entity, id ?? null, values, scope, client)
      return textResult(await getResumeSource(client))
    }
  )

  server.registerTool(
    'delete_item_curriculo',
    {
      title: 'Excluir item do currículo',
      description: 'Remove um item (excluir uma categoria remove as habilidades dela).',
      inputSchema: { entity: entitySchema, id: z.string().uuid() },
    },
    async ({ entity, id }) => {
      await deleteResumeItem(entity, id, client)
      return textResult({ deleted: id })
    }
  )

  server.registerTool(
    'mover_item_curriculo',
    {
      title: 'Reordenar item do currículo',
      description: 'Sobe ou desce um item uma posição na própria lista (habilidades: dentro da categoria, informe category_id).',
      inputSchema: {
        entity: entitySchema,
        id: z.string().uuid(),
        direction: z.enum(['up', 'down']),
        category_id: z.string().uuid().optional(),
      },
    },
    async ({ entity, id, direction, category_id }) => {
      await moveResumeItem(entity, id, direction === 'up' ? -1 : 1, category_id ? { column: 'category_id', value: category_id } : undefined, client)
      return textResult({ moved: id, direction })
    }
  )

  server.registerTool(
    'set_projeto_no_curriculo',
    {
      title: 'Incluir/remover projeto do currículo',
      description: 'Marca ou desmarca um projeto no currículo. Ao incluir, vai pro fim da ordem. Os textos O quê/Com quê/Resolve se editam com upsert_projeto.',
      inputSchema: { id: z.string().uuid(), in_resume: z.boolean() },
    },
    async ({ id, in_resume }) => {
      await setProjectInResume(id, in_resume, client)
      return textResult({ id, in_resume })
    }
  )

  server.registerTool(
    'mover_projeto_no_curriculo',
    {
      title: 'Reordenar projeto no currículo',
      inputSchema: { id: z.string().uuid(), direction: z.enum(['up', 'down']) },
    },
    async ({ id, direction }) => {
      await moveProjectInResume(id, direction === 'up' ? -1 : 1, client)
      return textResult({ moved: id, direction })
    }
  )
}
