export const MCP_RESOURCES = [
  'projetos',
  'artigos',
  'tecnologias',
  'autores',
  'curriculo',
  'conteudo_site',
  'mensagens',
] as const

export type McpResource = (typeof MCP_RESOURCES)[number]

export type McpResourcePermission = { read?: boolean; write?: boolean }

export type McpPermissions = Partial<Record<McpResource, McpResourcePermission>>

export const MCP_RESOURCE_LABELS: Record<McpResource, string> = {
  projetos: 'Projetos (inclui empresas e vínculos com tecnologias/autores)',
  artigos: 'Artigos',
  tecnologias: 'Tecnologias',
  autores: 'Autores',
  curriculo: 'Currículo (e seus links)',
  conteudo_site: 'Conteúdo do site (textos, SEO, personalização, links de contato)',
  mensagens: 'Mensagens recebidas pelo formulário de contato',
}

export function canRead(permissions: McpPermissions, resource: McpResource): boolean {
  return Boolean(permissions[resource]?.read)
}

export function canWrite(permissions: McpPermissions, resource: McpResource): boolean {
  return Boolean(permissions[resource]?.write)
}

export function emptyPermissions(): McpPermissions {
  return {}
}
