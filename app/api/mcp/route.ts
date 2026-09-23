import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { authenticateMcpToken } from '@/lib/mcp/auth'
import { buildMcpServer } from '@/lib/mcp/server'
import { createServiceClient } from '@/lib/supabase/service'

// stateless: cada request cria server/transport próprios, sem estado
// compartilhado entre invocações — combina com o modelo serverless da Vercel.
async function handler(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token) {
    return Response.json({ error: 'Token ausente. Use o cabeçalho "Authorization: Bearer <token>".' }, { status: 401 })
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
