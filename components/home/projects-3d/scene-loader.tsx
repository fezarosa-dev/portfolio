'use client'

import { useId } from 'react'

// bolha de "líquido" girando (máscara SVG + contraste) enquanto a cena 3D carrega; o estilo fica em
// app/globals.css (.scene-loader). O id da máscara precisa ser único e válido dentro de url(#...)
export function SceneLoader({ label }: { label: string }) {
  const id = `scene-loader-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <div role="status" className="flex flex-col items-center gap-5">
      <div className="scene-loader">
        <svg width={100} height={100} viewBox="0 0 100 100" aria-hidden>
          <defs>
            <mask id={id} className="scene-loader-mask">
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
          </defs>
        </svg>
        <div className="scene-loader-box" style={{ mask: `url(#${id})`, WebkitMask: `url(#${id})` }} />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-steel">{label}</p>
    </div>
  )
}
