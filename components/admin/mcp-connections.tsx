'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MCP_RESOURCES, MCP_RESOURCE_LABELS, type McpPermissions, type McpResource } from '@/lib/mcp/resources'
import type { McpConnection } from '@/lib/mcp/connections'

type Actions = {
  create: (nickname: string, permissions: McpPermissions) => Promise<{ connection: McpConnection; token: string }>
  rename: (id: string, nickname: string) => Promise<void>
  setStatus: (id: string, status: 'active' | 'revoked') => Promise<void>
  setPermissions: (id: string, permissions: McpPermissions) => Promise<void>
  remove: (id: string) => Promise<void>
}

function PermissionsGrid({
  permissions,
  onChange,
}: {
  permissions: McpPermissions
  onChange: (resource: McpResource, field: 'read' | 'write', value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {MCP_RESOURCES.map((resource) => (
        <div key={resource} className="flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2">
          <span className="text-sm">{MCP_RESOURCE_LABELS[resource]}</span>
          <div className="flex shrink-0 gap-3 font-mono text-xs">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-signal"
                checked={Boolean(permissions[resource]?.read)}
                onChange={(e) => onChange(resource, 'read', e.target.checked)}
              />
              ler
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-signal"
                checked={Boolean(permissions[resource]?.write)}
                onChange={(e) => onChange(resource, 'write', e.target.checked)}
              />
              editar
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}

function CreateConnectionDialog({ create }: { create: Actions['create'] }) {
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState('')
  const [permissions, setPermissions] = useState<McpPermissions>({})
  const [reveal, setReveal] = useState<{ nickname: string; token: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function updatePermission(resource: McpResource, field: 'read' | 'write', value: boolean) {
    setPermissions((prev) => ({ ...prev, [resource]: { ...prev[resource], [field]: value } }))
  }

  function handleCreate() {
    if (!nickname.trim()) return
    startTransition(async () => {
      try {
        const { token } = await create(nickname.trim(), permissions)
        setReveal({ nickname: nickname.trim(), token })
        setOpen(false)
        setNickname('')
        setPermissions({})
      } catch {
        toast.error('Não deu pra criar a conexão. Tenta de novo.')
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>Nova conexão</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova conexão MCP</DialogTitle>
            <DialogDescription>
              Escolha um apelido e o que essa conexão pode ler e editar. O token de acesso só aparece uma vez, logo
              depois de criar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcp-nickname">Apelido</Label>
              <Input
                id="mcp-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ex.: Claude Desktop"
              />
            </div>
            <PermissionsGrid permissions={permissions} onChange={updatePermission} />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={pending || !nickname.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reveal)} onOpenChange={(next) => !next && setReveal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Token de &ldquo;{reveal?.nickname}&rdquo;</DialogTitle>
            <DialogDescription>
              Copie agora — por segurança, esse token não fica salvo em texto puro e não será mostrado de novo. Se
              perder, revogue essa conexão e crie outra.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={reveal?.token ?? ''} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (reveal) navigator.clipboard.writeText(reveal.token)
                toast.success('Token copiado')
              }}
            >
              Copiar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            URL do servidor MCP: <code className="font-mono">/api/mcp</code>. Autenticação por cabeçalho{' '}
            <code className="font-mono">Authorization: Bearer &lt;token&gt;</code> — se o cliente não deixar setar
            esse cabeçalho manualmente (ex.: conectores da claude.ai), use{' '}
            <code className="font-mono">X-Auth-Token: &lt;token&gt;</code> (sem &ldquo;Bearer&rdquo;) no lugar.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ConnectionCard({ connection, actions }: { connection: McpConnection; actions: Actions }) {
  const [nickname, setNickname] = useState(connection.nickname)
  const [permissions, setPermissions] = useState<McpPermissions>(connection.permissions)
  const [pending, startTransition] = useTransition()

  function updatePermission(resource: McpResource, field: 'read' | 'write', value: boolean) {
    const next = { ...permissions, [resource]: { ...permissions[resource], [field]: value } }
    setPermissions(next)
    startTransition(async () => {
      try {
        await actions.setPermissions(connection.id, next)
      } catch {
        setPermissions(permissions)
        toast.error('Não deu pra salvar a permissão. Tenta de novo.')
      }
    })
  }

  function handleRename() {
    if (!nickname.trim() || nickname === connection.nickname) return
    startTransition(async () => {
      try {
        await actions.rename(connection.id, nickname.trim())
        toast.success('Apelido atualizado')
      } catch {
        setNickname(connection.nickname)
        toast.error('Não deu pra renomear. Tenta de novo.')
      }
    })
  }

  function toggleStatus() {
    const next = connection.status === 'active' ? 'revoked' : 'active'
    startTransition(async () => {
      try {
        await actions.setStatus(connection.id, next)
        toast.success(next === 'active' ? 'Conexão reativada' : 'Conexão revogada')
      } catch {
        toast.error('Não deu pra alterar o status. Tenta de novo.')
      }
    })
  }

  function handleRemove() {
    if (!confirm(`Remover a conexão "${connection.nickname}" permanentemente?`)) return
    startTransition(async () => {
      try {
        await actions.remove(connection.id)
        toast.success('Conexão removida')
      } catch {
        toast.error('Não deu pra remover. Tenta de novo.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-hairline bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} onBlur={handleRename} className="h-8 w-48" />
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
              connection.status === 'active' ? 'bg-status/10 text-status' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {connection.status === 'active' ? 'ativa' : 'revogada'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={toggleStatus}>
            {connection.status === 'active' ? 'Revogar' : 'Reativar'}
          </Button>
          <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={handleRemove}>
            Remover
          </Button>
        </div>
      </div>
      <PermissionsGrid permissions={permissions} onChange={updatePermission} />
      {connection.last_used_at && (
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          último uso: {new Date(connection.last_used_at).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  )
}

export function McpConnectionsPanel({ connections, actions }: { connections: McpConnection[]; actions: Actions }) {
  return (
    <div className="flex flex-col gap-4">
      <CreateConnectionDialog create={actions.create} />
      {connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conexão ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} actions={actions} />
          ))}
        </div>
      )}
    </div>
  )
}
