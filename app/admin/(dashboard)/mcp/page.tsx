import { listMcpConnections } from '@/lib/mcp/connections'
import { McpConnectionsPanel } from '@/components/admin/mcp-connections'
import { createConnection, renameConnection, setConnectionStatus, setConnectionPermissions, removeConnection } from './actions'

export default async function McpPage() {
  const connections = await listMcpConnections()

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Conexões MCP</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Cada conexão gera um token pra uma IA (Claude, ChatGPT etc.) ler e editar o conteúdo do site em seu nome, via{' '}
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="underline">
          MCP
        </a>
        . Configure o cliente MCP com a URL <code className="font-mono text-xs">/api/mcp</code> deste site e o token
        gerado abaixo.
      </p>
      <McpConnectionsPanel
        connections={connections}
        actions={{
          create: createConnection,
          rename: renameConnection,
          setStatus: setConnectionStatus,
          setPermissions: setConnectionPermissions,
          remove: removeConnection,
        }}
      />
    </div>
  )
}
