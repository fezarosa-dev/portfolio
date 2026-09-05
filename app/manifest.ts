import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Felipe Zanoni da Rosa — Portfólio',
    short_name: 'Zanoni',
    description: 'Portfólio de Felipe Zanoni da Rosa, desenvolvedor de software full stack.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#f2661d',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
