/** CEP só com os 8 dígitos (aceita "37500-000", "37.500-000" etc.). */
export const normalizeCep = (value: string) => value.replace(/\D/g, '')

/** Formato de CEP válido: exatamente 8 dígitos. */
export const isCep = (value: string) => /^\d{8}$/.test(normalizeCep(value))

/** "37500000" → "37500-000". */
export const formatCep = (value: string) => normalizeCep(value).replace(/^(\d{5})(\d{3})$/, '$1-$2')

export type CepPlace = { cep: string; city: string; state: string; lat: number; lon: number }

/**
 * Cidade, estado e coordenadas de um CEP: BrasilAPI (que já costuma trazer as coordenadas) e, se faltarem, a
 * coordenada da cidade pelo Nominatim (OpenStreetMap). Erro com mensagem legível se o CEP não existir.
 */
export async function lookupCep(value: string, fetcher: typeof fetch = fetch): Promise<CepPlace> {
  const cep = normalizeCep(value)
  if (!isCep(cep)) throw new Error('CEP inválido: use os 8 dígitos (ex.: 37500-000).')
  let place: { city: string; state: string; lat: number; lon: number } | null = null
  // 1) BrasilAPI: cidade e quase sempre as coordenadas
  const res = await fetcher(`https://brasilapi.com.br/api/cep/v2/${cep}`).catch(() => null)
  if (res?.ok) {
    const data = (await res.json()) as {
      city?: string
      state?: string
      location?: { coordinates?: { latitude?: string | number; longitude?: string | number } }
    }
    if (data.city && data.state)
      place = { city: data.city, state: data.state, lat: Number(data.location?.coordinates?.latitude), lon: Number(data.location?.coordinates?.longitude) }
  }
  // 2) reserva: ViaCEP (só cidade e estado; ele diz "erro" quando o CEP não existe)
  if (!place) {
    const via = await fetcher(`https://viacep.com.br/ws/${cep}/json/`).catch(() => null)
    if (!via?.ok) throw new Error('Não deu pra consultar o CEP agora. Tenta de novo em instantes.')
    const data = (await via.json()) as { erro?: unknown; localidade?: string; uf?: string }
    if (data.erro || !data.localidade || !data.uf) throw new Error(`CEP ${formatCep(cep)} não encontrado.`)
    place = { city: data.localidade, state: data.uf, lat: NaN, lon: NaN }
  }
  // 3) sem coordenadas: as da cidade pelo Nominatim (OpenStreetMap)
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon) || (place.lat === 0 && place.lon === 0)) {
    const q = encodeURIComponent(`${place.city}, ${place.state}, Brasil`)
    // o navegador ignora o User-Agent (manda o dele); no servidor (MCP) ele identifica o site, como pede o Nominatim
    const geo = await fetcher(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, { headers: { 'User-Agent': 'zanoni.dev.br' } }).catch(() => null)
    const hit = geo?.ok ? ((await geo.json()) as { lat: string; lon: string }[])[0] : undefined
    if (!hit) throw new Error(`Achei ${place.city} – ${place.state}, mas não a localização no mapa.`)
    place = { ...place, lat: Number(hit.lat), lon: Number(hit.lon) }
  }
  // guarda só no nível do bairro (2 casas decimais, ~1 km): a coordenada da BrasilAPI é da rua
  return { cep, ...place, lat: Math.round(place.lat * 100) / 100, lon: Math.round(place.lon * 100) / 100 }
}
