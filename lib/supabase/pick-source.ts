/** Escolhe entre a fonte crua (preview) e a cacheada. Extraída pra testar. */
export function pickSource<T>(preview: boolean, rawSource: T, cachedSource: T): T {
  return preview ? rawSource : cachedSource
}
