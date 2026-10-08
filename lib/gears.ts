// Engrenagens com dentes trapezoidais. `module` é o mesmo pra todas as engrenagens que se engatam:
// raio primitivo = dentes * module / 2, e a distância entre centros = soma dos raios primitivos.
export function pitchRadius(teeth: number, module: number): number {
  return (teeth * module) / 2
}

/** Path SVG (centrado na origem) com furo central; usar fill-rule evenodd. */
export function gearPath(teeth: number, module: number): string {
  const r = pitchRadius(teeth, module)
  const tip = r + 0.8 * module
  const root = r - 1.0 * module
  const step = (Math.PI * 2) / teeth
  const pt = (radius: number, angle: number) => `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`
  const parts: string[] = []
  for (let k = 0; k < teeth; k++) {
    const c = k * step // centro do dente
    parts.push(
      pt(root, c - step * 0.3),
      pt(tip, c - step * 0.17),
      pt(tip, c + step * 0.17),
      pt(root, c + step * 0.3)
    )
  }
  const hole = root * 0.35
  return `M${parts.join('L')}Z M${hole},0 a${hole},${hole} 0 1,0 ${-2 * hole},0 a${hole},${hole} 0 1,0 ${2 * hole},0Z`
}

/**
 * Rotação inicial (graus) da engrenagem B engatada em A, com B no ângulo `theta` (graus) a partir de A.
 * Considera A com um dente exatamente em `theta`; então B precisa de um vão em `theta + 180`.
 */
export function meshedPhase(teethB: number, theta: number): number {
  return theta + 180 - 180 / teethB
}

/** Rotação de B (graus) dado o giro de A: sentido oposto, velocidade inversamente proporcional aos dentes. */
export function meshedAngle(angleA: number, teethA: number, teethB: number): number {
  return -angleA * (teethA / teethB)
}
