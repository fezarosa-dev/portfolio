// Passa estado de uma página pra outra sem sujar a URL (nada de ?param=...): o link grava, a página de destino lê uma vez.
export function setHandoff(key: string, value: unknown) {
  try {
    sessionStorage.setItem(`handoff:${key}`, JSON.stringify(value))
  } catch {}
}

export function takeHandoff<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`handoff:${key}`)
    if (raw === null) return null
    sessionStorage.removeItem(`handoff:${key}`)
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
