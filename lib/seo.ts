import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n'

const SITE_URL = 'https://www.zanoni.dev.br'
const SITE_NAME = 'Felipe Zanoni da Rosa'

export function localizedAlternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: { pt: `/pt${path}`, en: `/en${path}` },
  }
}

export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  type: 'website' | 'article' = 'website'
): Metadata {
  const url = `${SITE_URL}/${locale}${path}`
  const fullTitle = `${title} — Zanoni`
  return {
    title,
    description,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      type,
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  }
}

type PageSeo = { title: string; description: string }

export const PAGE_SEO: Record<string, Record<Locale, PageSeo>> = {
  sobre: {
    pt: {
      title: 'Sobre mim',
      description:
        'Conheça a trajetória de Felipe Zanoni da Rosa, desenvolvedor de software full stack — experiência, formação e o que me move como profissional.',
    },
    en: {
      title: 'About',
      description:
        "Learn about Felipe Zanoni da Rosa's background as a full stack software developer — experience, education and what drives me as a professional.",
    },
  },
  servicos: {
    pt: {
      title: 'Serviços',
      description:
        'Serviços de desenvolvimento de software sob medida: aplicações web, automações e soluções full stack, com Felipe Zanoni da Rosa.',
    },
    en: {
      title: 'Services',
      description:
        'Custom software development services: web applications, automation and full stack solutions, by Felipe Zanoni da Rosa.',
    },
  },
  projetos: {
    pt: {
      title: 'Projetos',
      description:
        'Projetos de software desenvolvidos por Felipe Zanoni da Rosa — código, tecnologias usadas e detalhes técnicos de cada um.',
    },
    en: {
      title: 'Projects',
      description:
        'Software projects built by Felipe Zanoni da Rosa — code, technologies used and technical details for each one.',
    },
  },
  artigos: {
    pt: {
      title: 'Artigos',
      description:
        'Artigos técnicos escritos por Felipe Zanoni da Rosa sobre desenvolvimento de software, boas práticas e tecnologia.',
    },
    en: {
      title: 'Articles',
      description:
        'Technical articles written by Felipe Zanoni da Rosa about software development, best practices and technology.',
    },
  },
  contato: {
    pt: {
      title: 'Contato',
      description:
        'Fale com Felipe Zanoni da Rosa — e-mail, redes sociais e formulário de contato pra oportunidades e colaborações.',
    },
    en: {
      title: 'Contact',
      description:
        'Get in touch with Felipe Zanoni da Rosa — email, social links and contact form for opportunities and collaborations.',
    },
  },
  curriculo: {
    pt: {
      title: 'Currículo',
      description:
        'Currículo de Felipe Zanoni da Rosa: experiência profissional, formação acadêmica, habilidades técnicas e certificações.',
    },
    en: {
      title: 'Resume',
      description:
        "Felipe Zanoni da Rosa's resume: professional experience, academic background, technical skills and certifications.",
    },
  },
}
