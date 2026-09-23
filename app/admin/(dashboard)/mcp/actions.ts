'use server'

import { revalidatePath } from 'next/cache'
import {
  createMcpConnection,
  renameMcpConnection,
  setMcpConnectionStatus,
  setMcpConnectionPermissions,
  deleteMcpConnection,
  type McpConnection,
} from '@/lib/mcp/connections'
import type { McpPermissions } from '@/lib/mcp/resources'

export async function createConnection(
  nickname: string,
  permissions: McpPermissions
): Promise<{ connection: McpConnection; token: string }> {
  const result = await createMcpConnection(nickname, permissions)
  revalidatePath('/admin/mcp')
  return result
}

export async function renameConnection(id: string, nickname: string): Promise<void> {
  await renameMcpConnection(id, nickname)
  revalidatePath('/admin/mcp')
}

export async function setConnectionStatus(id: string, status: 'active' | 'revoked'): Promise<void> {
  await setMcpConnectionStatus(id, status)
  revalidatePath('/admin/mcp')
}

export async function setConnectionPermissions(id: string, permissions: McpPermissions): Promise<void> {
  await setMcpConnectionPermissions(id, permissions)
  revalidatePath('/admin/mcp')
}

export async function removeConnection(id: string): Promise<void> {
  await deleteMcpConnection(id)
  revalidatePath('/admin/mcp')
}
