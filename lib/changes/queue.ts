import type { Change, ChangeOp } from './types.ts'

const entityOf = (op: ChangeOp) => op.type.split('.')[0]

/** Chave de coalescência: editar o mesmo campo de novo substitui a entrada anterior. */
export function opKey(op: ChangeOp): string {
  switch (op.type) {
    case 'language.update':
    case 'category.update':
      return `${entityOf(op)}:${op.id}:${op.field}`
    case 'language.order':
    case 'category.order':
      return `${entityOf(op)}:order`
    default:
      return `${entityOf(op)}:${op.id}:${op.type.split('.')[1]}`
  }
}

/** Entidade afetada ("language:abc"), ou null pras ordenações. */
export function targetOf(op: ChangeOp): string | null {
  if (op.type === 'language.order' || op.type === 'category.order') return null
  return `${entityOf(op)}:${op.id}`
}

export function makeChange(op: ChangeOp, label: string, id: string, ts: number): Change {
  return { id, key: opKey(op), ts, label, op, status: 'pending' }
}

const isAdd = (c: Change) => c.op.type.endsWith('.add')
const isUpdate = (c: Change) => c.op.type.endsWith('.update')

/** Pilha LIFO: o mais recente fica no índice 0. */
export function enqueue(stack: Change[], change: Change): Change[] {
  const target = targetOf(change.op)
  if (change.op.type.endsWith('.remove') && target) {
    // criado e apagado antes de enviar: some tudo, nada vai pro banco
    if (stack.some((c) => isAdd(c) && targetOf(c.op) === target)) {
      return stack.filter((c) => targetOf(c.op) !== target)
    }
    // edições pendentes de algo que vai ser apagado não servem mais
    return [change, ...stack.filter((c) => c.key !== change.key && !(isUpdate(c) && targetOf(c.op) === target))]
  }
  return [change, ...stack.filter((c) => c.key !== change.key)]
}

export function revoke(stack: Change[], id: string): Change[] {
  const change = stack.find((c) => c.id === id)
  if (!change) return stack
  const target = targetOf(change.op)
  // revogar a criação leva junto o que dependia dela
  if (isAdd(change) && target) return stack.filter((c) => targetOf(c.op) !== target)
  return stack.filter((c) => c.id !== id)
}

/** Ordem de aplicação no banco: do mais antigo pro mais novo. */
export function sendOrder(stack: Change[]): Change[] {
  return [...stack].reverse()
}

export type SendResult = { id: string; ok: boolean; error?: string }

export function settle(stack: Change[], results: SendResult[]): Change[] {
  const byId = new Map(results.map((r) => [r.id, r]))
  return stack.flatMap((c) => {
    const r = byId.get(c.id)
    if (!r) return [c]
    if (r.ok) return []
    return [{ ...c, status: 'error' as const, error: r.error ?? 'erro desconhecido' }]
  })
}
