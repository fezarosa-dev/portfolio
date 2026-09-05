import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.zanoni.dev.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/site-icon', '/api/drive-image/', '/api/drive-video/'],
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
