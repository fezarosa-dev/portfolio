'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

// Barra fina no topo que enche conforme a página rola (com mola pra suavizar).
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 })
  return <motion.div aria-hidden className="scroll-progress" style={{ scaleX }} />
}
