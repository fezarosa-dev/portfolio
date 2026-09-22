export function reciprocalRankFusion<T extends { id: string }>(
  listA: T[],
  listB: T[],
  k = 60
): T[] {
  const scores = new Map<string, number>()
  const items = new Map<string, T>()

  function scoreList(list: T[]) {
    list.forEach((item, index) => {
      items.set(item.id, item)
      scores.set(item.id, (scores.get(item.id) ?? 0) + 1 / (k + index + 1))
    })
  }

  scoreList(listA)
  scoreList(listB)

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => items.get(id) as T)
}
