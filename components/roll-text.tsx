// Texto que "rola" no hover do link/botão pai: o rótulo sobe e uma cópia laranja entra por baixo (CSS em globals.css).
export function RollText({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  )
}
