import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { authenticateMcpToken } from '@/lib/mcp/auth'
import { buildMcpServer } from '@/lib/mcp/server'
import { createServiceClient } from '@/lib/supabase/service'

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim()

  // fallback pra clientes cuja UI reserva o cabeçalho "Authorization" pro
  // próprio fluxo OAuth do conector (ex.: claude.ai) e não deixa setar manual.
  const custom = request.headers.get('x-auth-token')
  return custom?.trim() || null
}

// stateless: cada request cria server/transport próprios, sem estado
// compartilhado entre invocações — combina com o modelo serverless da Vercel.
async function handler(request: Request): Promise<Response> {
  const token = extractToken(request)
  if (!token) {
    return Response.json(
      { error: 'Token ausente. Use o cabeçalho "Authorization: Bearer <token>" ou "X-Auth-Token: <token>".' },
      { status: 401 }
    )
  }

  let auth
  try {
    auth = await authenticateMcpToken(token)
  } catch {
    return Response.json({ error: 'Servidor MCP não configurado.' }, { status: 500 })
  }
  if (!auth) {
    return Response.json({ error: 'Token inválido ou revogado.' }, { status: 401 })
  }

  const transport = new WebStandardStreamableHTTPServerTransport()
  const server = buildMcpServer(auth, createServiceClient())
  await server.connect(transport)
  return transport.handleRequest(request)
}

export { handler as GET, handler as POST, handler as DELETE }
