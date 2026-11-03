import { geoContains, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, FeatureCollection } from 'geojson'
import land110 from 'world-atlas/land-110m.json'
import countries110 from 'world-atlas/countries-110m.json'
import countries50 from 'world-atlas/countries-50m.json'

/** Tamanho do quadro do SVG do globo (o disco ocupa o quadro todo). */
export const GLOBE_BOX = 2000

/** Onde o foguete sai quando ainda não há CEP salvo: o meio do Brasil. */
export const DEFAULT_LAUNCH = { lat: -14.2, lon: -51.9 }

// a parte de cima do disco é o que aparece como horizonte na seção de contato: o centro do disco fica ao sul do
// ponto, que assim aparece no alto e no meio
const TILT = 58

type Topo = Topology<{ land?: GeometryCollection; countries?: GeometryCollection }>

/**
 * A Terra vista do espaço, só em contornos no laranja do site, girada para o ponto de lançamento e com o país dele
 * destacado. Devolve o SVG e onde o ponto cai no quadro (para o rastro do foguete sair dali).
 */
function projectionFor(launch: { lat: number; lon: number }) {
  return geoOrthographic()
    .rotate([-launch.lon, -Math.max(-89, launch.lat - TILT)])
    .scale(GLOBE_BOX / 2)
    .translate([GLOBE_BOX / 2, GLOBE_BOX / 2])
    .precision(0.3)
}

/** Onde o ponto de lançamento cai no quadro do globo (sem gerar o desenho). */
export function launchPoint(launch: { lat: number; lon: number }) {
  const [x, y] = projectionFor(launch)([launch.lon, launch.lat]) ?? [GLOBE_BOX / 2, GLOBE_BOX / 2]
  return { x: Math.round(x), y: Math.round(y) }
}

export function buildGlobe(launch: { lat: number; lon: number }) {
  const projection = projectionFor(launch)
  const path = geoPath(projection).digits(1)
  const land = feature(land110 as unknown as Topo, (land110 as unknown as Topo).objects.land!)
  const c110 = countries110 as unknown as Topo
  const borders = mesh(c110, c110.objects.countries!, (a, b) => a !== b)
  const c50 = feature(countries50 as unknown as Topo, (countries50 as unknown as Topo).objects.countries!) as FeatureCollection
  const home = c50.features.find((f: Feature) => geoContains(f, [launch.lon, launch.lat]))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GLOBE_BOX} ${GLOBE_BOX}" fill="none">
  <defs>
    <radialGradient id="sea" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#f2661d" stop-opacity="0.07"/>
      <stop offset="70%" stop-color="#2b2024" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${GLOBE_BOX / 2}" cy="${GLOBE_BOX / 2}" r="${GLOBE_BOX / 2 - 1}" fill="url(#sea)" stroke="#f2661d" stroke-opacity="0.75" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
  <path d="${path(geoGraticule10())}" stroke="#f2661d" stroke-opacity="0.09" stroke-width="1" vector-effect="non-scaling-stroke"/>
  <path d="${path(borders)}" stroke="#b0775a" stroke-opacity="0.35" stroke-width="0.8" vector-effect="non-scaling-stroke"/>
  <path d="${path(land)}" stroke="#f2661d" stroke-opacity="0.55" stroke-width="1.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  ${home ? `<path d="${path(home)}" fill="#f2661d" fill-opacity="0.13" stroke="#f2661d" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` : ''}
</svg>
`
  return svg
}

// privacidade: a coordenada do CEP é de rua; no site (desenho e URL do globo) vai só no nível da cidade
// (1 casa decimal, uns 10 km). No globo isso nem aparece: cada pixel dele já vale uns 20 km
const coarse = (v: number) => Math.round(v * 10) / 10

/** Ponto de lançamento salvo no painel (CEP → coordenadas em site_content), arredondado; sem CEP, o meio do Brasil. */
export function launchFrom(content: Record<string, string>) {
  const lat = Number(content.launch_lat)
  const lon = Number(content.launch_lon)
  return Number.isFinite(lat) && Number.isFinite(lon) && content.launch_lat && content.launch_lon
    ? { lat: coarse(lat), lon: coarse(lon) }
    : DEFAULT_LAUNCH
}
