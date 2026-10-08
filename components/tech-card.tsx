'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HandoffLink } from '@/components/handoff-link'
import { useReduceMotion } from '@/components/reduce-motion-provider'

const PER_PAGE = 4
const EASE = [0.22, 1, 0.36, 1] as const

export type TechCardData = {
  id: string
  name: string
  icon: string | null
  percentage: number
  projects: { id: string; title: string }[]
}

// Setinha de paginação: ao clicar, a seta "dispara" pra fora do botão e reentra pelo lado oposto.
function PageButton({
  dir,
  label,
  onClick,
  reduce,
  disabled,
}: {
  dir: -1 | 1
  label: string
  onClick: () => void
  reduce: boolean
  disabled: boolean
}) {
  const arrow = useAnimationControls()
  const Icon = dir === 1 ? ChevronRight : ChevronLeft
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        onClick()
        if (!reduce) {
          arrow.start({
            x: [0, dir * 14, -dir * 14, 0],
            opacity: [1, 0, 0, 1],
            transition: {
              duration: 0.45,
              times: [0, 0.4, 0.41, 1],
              ease: EASE,
            },
          })
        }
      }}
      whileHover={reduce || disabled ? undefined : { scale: 1.12 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.82 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${disabled ? 'cursor-not-allowed border-dashed border-hairline bg-transparent text-steel/30' : 'border-signal bg-signal text-white shadow-sm shadow-signal/30 hover:brightness-110'}`}
    >
      <motion.span animate={arrow} className="relative flex">
        <Icon className="h-4 w-4" />
      </motion.span>
    </motion.button>
  )
}

export function TechCard({
  tech,
  locale,
  labels,
  index,
}: {
  tech: TechCardData
  locale: string
  labels: { projects: string; none: string; prev: string; next: string }
  index: number
}) {
  const { enabled: reduce } = useReduceMotion()
  const pages = Math.max(1, Math.ceil(tech.projects.length / PER_PAGE))
  const [[page, dir], setPage] = useState<[number, -1 | 1]>([0, 1])

  const go = (d: -1 | 1) => setPage(([p]) => [Math.min(pages - 1, Math.max(0, p + d)), d])
  const visible = tech.projects.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
  const slide = reduce ? 0 : 28

  return (
    <motion.article
      className="flex h-full flex-col rounded-xl border border-hairline bg-card p-5 transition-colors hover:border-signal/60"
    >
      <HandoffLink href={`/${locale}/projetos`} handoff={['tech', [tech.id]]} className="group flex items-center gap-3">
        {tech.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tech.icon}
            alt=""
            className="h-12 w-12 shrink-0"
          />
        ) : (
          <span className="h-12 w-12 shrink-0 rounded-lg bg-hairline" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-mono text-lg font-medium text-foreground transition-colors group-hover:text-signal">
            {tech.name}
          </h3>
          <p className="font-mono text-xs text-steel">{tech.projects.length ? labels.projects : labels.none}</p>
        </div>
        <span className="font-mono text-2xl font-medium text-signal">{tech.percentage}%</span>
      </HandoffLink>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-hairline">
        <motion.div
          className="h-full rounded-full bg-signal"
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${tech.percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
          style={reduce ? { width: `${tech.percentage}%` } : undefined}
        />
      </div>

      {tech.projects.length > 0 && (
        <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
          <motion.div
            className="relative touch-pan-y"
            onPanEnd={(_, info) => {
              if (pages > 1 && Math.abs(info.offset.x) > 40) go(info.offset.x < 0 ? 1 : -1)
            }}
            style={{ minHeight: `${PER_PAGE * 2.25}rem` }}
          >
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.ul key={page} className="flex flex-col gap-1">
                {visible.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={{
                      opacity: 0,
                      x: dir * slide,
                      filter: reduce ? 'blur(0px)' : 'blur(6px)',
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      filter: 'blur(0px)',
                      transition: {
                        duration: reduce ? 0 : 0.45,
                        delay: reduce ? 0 : i * 0.06,
                        ease: EASE,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: -dir * slide,
                      filter: reduce ? 'blur(0px)' : 'blur(6px)',
                      transition: {
                        duration: reduce ? 0 : 0.2,
                        delay: reduce ? 0 : i * 0.02,
                      },
                    }}
                  >
                    <Link
                      href={`/${locale}/projetos/${p.id}`}
                      className="group/row flex h-8 items-center gap-2 rounded-md border border-hairline px-2.5 text-sm text-foreground/80 transition-colors hover:border-signal hover:bg-signal/10 hover:text-signal"
                    >
                      <span className="truncate">{p.title}</span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/row:translate-x-0 group-hover/row:opacity-100" />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </motion.div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <PageButton dir={-1} label={labels.prev} onClick={() => go(-1)} reduce={reduce} disabled={page === 0} />
              <div className="flex flex-col items-center gap-1.5" aria-live="polite">
                <div className="flex items-center gap-1 font-mono text-xs text-steel">
                  <span className="relative inline-flex h-4 w-3 justify-center overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                      <motion.span
                        key={page}
                        initial={reduce ? false : { y: dir * 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={reduce ? undefined : { y: -dir * 14, opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                        className="font-medium text-signal"
                      >
                        {page + 1}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span>/ {pages}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: pages }, (_, i) => (
                    <motion.span
                      key={i}
                      animate={{
                        width: i === page ? 20 : 6,
                        opacity: i === page ? 1 : 0.35,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="h-1.5 rounded-full bg-signal"
                    />
                  ))}
                </div>
              </div>
              <PageButton
                dir={1}
                label={labels.next}
                onClick={() => go(1)}
                reduce={reduce}
                disabled={page === pages - 1}
              />
            </div>
          )}
        </div>
      )}
    </motion.article>
  )
}
