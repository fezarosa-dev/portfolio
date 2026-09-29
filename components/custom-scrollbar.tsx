'use client'

import { useEffect, useRef, useState } from 'react'

const MIN_THUMB = 44

// Substitui a barra de rolagem nativa (escondida via html.custom-scrollbar) por uma
// pílula fina que aparece ao rolar/passar o mouse, cresce no hover e dá pra arrastar.
// Só em ponteiro fino (mouse); em telas de toque fica a barra nativa.
export function CustomScrollbar() {
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dragging, setDragging] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hovered = useRef(false)

  const flash = () => {
    setVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (!hovered.current) setVisible(false)
    }, 1200)
  }

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const root = document.documentElement
    root.classList.add('custom-scrollbar')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(true)

    return () => {
      root.classList.remove('custom-scrollbar')
      clearTimeout(hideTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    let raf = 0

    const update = () => {
      raf = 0
      const t = track.current
      const th = thumb.current
      if (!t || !th) return
      const { scrollHeight, clientHeight, scrollTop } = root
      const scrollable = scrollHeight - clientHeight
      t.style.display = scrollable > 1 ? '' : 'none'
      const room = t.clientHeight
      const h = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * room)
      const y = scrollable > 0 ? (scrollTop / scrollable) * (room - h) : 0
      th.style.height = `${h}px`
      th.style.transform = `translateY(${y}px)`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onScroll = () => {
      schedule()
      flash()
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
    }
  }, [active])

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const t = track.current!
    const th = thumb.current!
    const root = document.documentElement
    th.setPointerCapture(e.pointerId)
    setDragging(true)
    const startY = e.clientY
    const startScroll = root.scrollTop
    const ratio = (root.scrollHeight - root.clientHeight) / (t.clientHeight - th.offsetHeight)

    const move = (ev: PointerEvent) => {
      root.scrollTop = startScroll + (ev.clientY - startY) * ratio
    }
    const end = () => {
      setDragging(false)
      th.removeEventListener('pointermove', move)
      th.removeEventListener('pointerup', end)
      th.removeEventListener('pointercancel', end)
    }
    th.addEventListener('pointermove', move)
    th.addEventListener('pointerup', end)
    th.addEventListener('pointercancel', end)
  }

  // clique no trilho: centraliza a pílula no ponto clicado
  const jump = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== track.current) return
    const root = document.documentElement
    const t = track.current!
    const rect = t.getBoundingClientRect()
    const frac = (e.clientY - rect.top) / rect.height
    root.scrollTo({ top: frac * (root.scrollHeight - root.clientHeight), behavior: 'smooth' })
  }

  if (!active) return null

  return (
    <div
      ref={track}
      className="scrollbar-track"
      data-visible={visible || dragging}
      data-dragging={dragging}
      onPointerEnter={() => {
        hovered.current = true
        flash()
      }}
      onPointerLeave={() => {
        hovered.current = false
        flash()
      }}
      onPointerDown={jump}
    >
      <div ref={thumb} className="scrollbar-thumb" data-cursor="hover" onPointerDown={startDrag} />
    </div>
  )
}
