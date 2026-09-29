'use client'

import { useEffect, useRef, useState } from 'react'

const MIN_THUMB = 28

// Área com rolagem própria (mesma pílula da barra do site, ver components/custom-scrollbar.tsx).
// A barra nativa fica escondida: o navegador não dispara eventos de mouse sobre ela, então o
// cursor customizado congelava e o cursor padrão aparecia por cima ao clicar/arrastar.
export function ScrollArea({
  children,
  className = '',
  scrollerClassName = '',
}: {
  children: React.ReactNode
  className?: string
  scrollerClassName?: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = scroller.current!
    let raf = 0

    const update = () => {
      raf = 0
      const t = track.current
      const th = thumb.current
      if (!t || !th) return
      const { scrollHeight, clientHeight, scrollTop } = el
      const scrollable = scrollHeight - clientHeight
      t.style.display = scrollable > 1 ? '' : 'none'
      const room = t.clientHeight
      const h = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * room)
      th.style.height = `${h}px`
      th.style.transform = `translateY(${scrollable > 0 ? (scrollTop / scrollable) * (room - h) : 0}px)`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    el.addEventListener('scroll', schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', schedule)
      ro.disconnect()
    }
  }, [])

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current!
    const t = track.current!
    const th = thumb.current!
    th.setPointerCapture(e.pointerId)
    setDragging(true)
    const startY = e.clientY
    const startScroll = el.scrollTop
    const ratio = (el.scrollHeight - el.clientHeight) / (t.clientHeight - th.offsetHeight)
    const move = (ev: PointerEvent) => {
      el.scrollTop = startScroll + (ev.clientY - startY) * ratio
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

  const jump = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== track.current) return
    const el = scroller.current!
    const rect = track.current!.getBoundingClientRect()
    const frac = (e.clientY - rect.top) / rect.height
    el.scrollTo({ top: frac * (el.scrollHeight - el.clientHeight), behavior: 'smooth' })
  }

  return (
    <div className={`${className.includes('absolute') ? '' : 'relative'} ${className}`}>
      <div ref={scroller} className={`hide-native-scroll overflow-y-auto pr-4 ${scrollerClassName}`}>
        {children}
      </div>
      <div ref={track} className="area-track" data-dragging={dragging} onPointerDown={jump}>
        <div ref={thumb} className="area-thumb" data-cursor="hover" onPointerDown={startDrag} />
      </div>
    </div>
  )
}
