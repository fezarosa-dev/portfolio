'use client'

import { useRef } from 'react'
import Script from 'next/script'

// botão oficial do Google Calendar (Appointment Scheduling): abre o agendamento num popup
const SCHEDULE_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3LgAE5XjA89aUgSlEv71TGibSDDogBlrGxcHgALmT6SsOtX6a8Er3BQ0glW97xNsbBqpr94qEF?gv=true'

type SchedulingButton = {
  load: (options: { url: string; color: string; label: string; target: HTMLElement }) => void
}

export function ScheduleButton({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function load() {
    const target = ref.current
    const scheduling = (window as unknown as { calendar?: { schedulingButton: SchedulingButton } }).calendar
    if (!target || !scheduling) return
    target.replaceChildren() // onReady roda a cada montagem; evita botão duplicado
    scheduling.schedulingButton.load({ url: SCHEDULE_URL, color: '#EF6C00', label, target })
  }

  return (
    <>
      <link rel="stylesheet" href="https://calendar.google.com/calendar/scheduling-button-script.css" precedence="default" />
      <Script src="https://calendar.google.com/calendar/scheduling-button-script.js" strategy="lazyOnload" onReady={load} />
      <div ref={ref} className="shrink-0" />
    </>
  )
}
