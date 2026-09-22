import { NextResponse } from 'next/server'
import { warmUpModel } from '@/lib/search/embed'

// ponytail: sem rate limit aqui de propósito -- warmUpModel() memoiza a promise
// de carregamento do modelo, entao chamadas repetidas so aguardam a mesma promise
// (idempotente e barato). Rate-limitar isso so serviria pra competir pelo mesmo
// balde do /api/search (mesma tabela search_requests), derrubando o limite real.
export async function POST() {
  await warmUpModel()
  return NextResponse.json({ ok: true })
}
