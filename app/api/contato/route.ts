import { resolve4, resolve6, resolveMx } from 'node:dns/promises'
import { NextResponse } from 'next/server'
import { countRecentMessagesFromIp, insertMessage } from '@/lib/supabase/queries'
import { notifyNewMessage } from '@/lib/notify'
import { clientIp, isSameOriginJson } from '@/lib/request-guard'

const CATEGORIES = ['vaga', 'projeto', 'duvida', 'outro']
const MAX_SUBJECT = 120
const MAX_MESSAGE = 4000
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MINUTES = 15

async function domainAcceptsEmail(domain: string): Promise<boolean> {
  try {
    const mx = await resolveMx(domain)
    if (mx.length > 0) return true
  } catch {
    // sem MX, tenta A/AAAA (fallback implícito de e-mail pra domínios sem MX)
  }
  try {
    await resolve4(domain)
    return true
  } catch {
    // segue pro próximo fallback
  }
  try {
    await resolve6(domain)
    return true
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isSameOriginJson(request)) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 403 })
  }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  // campo-armadilha (invisível pra pessoas): robôs preenchem, aí fingimos sucesso e descartamos
  if (String(body.website ?? '').trim()) return NextResponse.json({ ok: true })
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const category = String(body.category ?? '')
  const message = String(body.message ?? '').trim()

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Escolha o assunto da mensagem.' }, { status: 400 })
  }
  if (subject.length > MAX_SUBJECT || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: 'Mensagem ou assunto muito longo.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  const domain = email.split('@')[1]
  if (!(await domainAcceptsEmail(domain))) {
    return NextResponse.json(
      { error: 'Esse domínio de e-mail não existe ou não recebe e-mails. Confira se digitou certo.' },
      { status: 400 }
    )
  }

  const ip = clientIp(request)
  const recentCount = await countRecentMessagesFromIp(ip, RATE_LIMIT_WINDOW_MINUTES)
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Muitas mensagens em pouco tempo. Tente de novo mais tarde.' },
      { status: 429 }
    )
  }

  await insertMessage({ name, email, subject, category, message, ip })
  await notifyNewMessage(name, email, subject, category, message)
  return NextResponse.json({ ok: true })
}
