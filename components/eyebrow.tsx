export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-wide text-signal">
      <span aria-hidden className="text-steel">{'// '}</span>
      {children}
    </p>
  )
}
