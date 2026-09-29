/**
 * Só aceita pedidos JSON vindos do próprio site: exige Content-Type JSON (um <form> de outro site
 * não consegue enviar isso sem preflight) e, quando o navegador manda Origin, que o host bata com o
 * do site. Sem Origin (curl, scripts), cai pro Sec-Fetch-Site: só recusa se for cross-site.
 */
export function isSameOriginJson(request: Request): boolean {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) return false

  const origin = request.headers.get('origin')
  if (origin) {
    const hosts = [request.headers.get('host'), request.headers.get('x-forwarded-host')].filter(Boolean)
    try {
      return hosts.includes(new URL(origin).host)
    } catch {
      return false
    }
  }
  return request.headers.get('sec-fetch-site') !== 'cross-site'
}

/**
 * IP do visitante pro rate limit. Sem o cabeçalho (fora da Vercel) cai num balde único 'unknown',
 * em vez de pular o limite -- pior caso: pedidos sem IP dividem a mesma cota.
 */
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
