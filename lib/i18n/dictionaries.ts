export type Locale = 'pt' | 'en'

export type Dictionary = {
  nav: {
    links: { href: string; label: string }[]
    menuOpen: string
    menuClose: string
    settings: string
  }
  footer: {
    email: string
    github: string
    linkedin: string
    exportAi: string
  }
  home: {
    whoami: string
    aboutEyebrow: string
    projectsEyebrow: string
    projectsHeading: string
    seeAll: string
  }
  sobre: { eyebrow: string; title: string }
  servicos: { eyebrow: string; title: string }
  projetos: {
    eyebrow: string
    title: string
    detailEyebrow: string
    back: string
    searchPlaceholder: string
    techPlaceholder: string
    notFound: string
    with: string
    at: string
    repo: string
    site: string
  }
  contato: {
    eyebrow: string
    title: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    send: string
    sending: string
    sent: string
    error: string
  }
  curriculo: { eyebrow: string; title: string }
  artigos: {
    eyebrow: string
    title: string
    detailEyebrow: string
    back: string
    notFound: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    nav: {
      links: [
        { href: '/', label: 'Início' },
        { href: '/sobre', label: 'Sobre mim' },
        { href: '/servicos', label: 'Serviços' },
        { href: '/projetos', label: 'Projetos' },
        { href: '/artigos', label: 'Artigos' },
        { href: '/contato', label: 'Contato' },
        { href: '/curriculo', label: 'Currículo' },
      ],
      menuOpen: 'Abrir menu',
      menuClose: 'Fechar menu',
      settings: 'Configurações',
    },
    footer: { email: 'e-mail', github: 'github', linkedin: 'linkedin', exportAi: 'exportar p/ IA' },
    home: {
      whoami: '$ whoami',
      aboutEyebrow: 'sobre',
      projectsEyebrow: 'projetos',
      projectsHeading: 'Coisas que construí',
      seeAll: 'ver todos os projetos →',
    },
    sobre: { eyebrow: 'sobre-mim', title: 'Sobre mim' },
    servicos: { eyebrow: 'serviços', title: 'Serviços' },
    projetos: {
      eyebrow: 'projetos',
      title: 'Projetos',
      detailEyebrow: 'projeto',
      back: '← projetos',
      searchPlaceholder: 'buscar por nome, tecnologia, empresa, autor…',
      techPlaceholder: 'filtrar tecnologia…',
      notFound: 'Nenhum projeto encontrado.',
      with: 'com',
      at: 'em',
      repo: 'repositório ↗',
      site: 'site ↗',
    },
    contato: {
      eyebrow: 'contato',
      title: 'Vamos conversar',
      nameLabel: 'Nome',
      namePlaceholder: 'Seu nome',
      emailLabel: 'E-mail',
      emailPlaceholder: 'Seu e-mail',
      messageLabel: 'Mensagem',
      messagePlaceholder: 'Sua mensagem',
      send: 'Enviar',
      sending: 'Enviando...',
      sent: '✓ mensagem enviada — obrigado pelo contato, retorno em breve.',
      error: '✗ erro ao enviar, tente de novo.',
    },
    curriculo: { eyebrow: 'currículo', title: 'Currículo' },
    artigos: {
      eyebrow: 'artigos',
      title: 'Artigos',
      detailEyebrow: 'artigo',
      back: '← artigos',
      notFound: 'Nenhum artigo encontrado.',
    },
  },
  en: {
    nav: {
      links: [
        { href: '/', label: 'Home' },
        { href: '/sobre', label: 'About' },
        { href: '/servicos', label: 'Services' },
        { href: '/projetos', label: 'Projects' },
        { href: '/artigos', label: 'Articles' },
        { href: '/contato', label: 'Contact' },
        { href: '/curriculo', label: 'Resume' },
      ],
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      settings: 'Settings',
    },
    footer: { email: 'email', github: 'github', linkedin: 'linkedin', exportAi: 'export for AI' },
    home: {
      whoami: '$ whoami',
      aboutEyebrow: 'about',
      projectsEyebrow: 'projects',
      projectsHeading: 'Things I built',
      seeAll: 'see all projects →',
    },
    sobre: { eyebrow: 'about-me', title: 'About me' },
    servicos: { eyebrow: 'services', title: 'Services' },
    projetos: {
      eyebrow: 'projects',
      title: 'Projects',
      detailEyebrow: 'project',
      back: '← projects',
      searchPlaceholder: 'search by name, tech, company, author…',
      techPlaceholder: 'filter technology…',
      notFound: 'No projects found.',
      with: 'with',
      at: 'at',
      repo: 'repository ↗',
      site: 'website ↗',
    },
    contato: {
      eyebrow: 'contact',
      title: "Let's talk",
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'Your email',
      messageLabel: 'Message',
      messagePlaceholder: 'Your message',
      send: 'Send',
      sending: 'Sending...',
      sent: "✓ message sent — thanks for reaching out, I'll get back to you soon.",
      error: '✗ failed to send, please try again.',
    },
    curriculo: { eyebrow: 'resume', title: 'Resume' },
    artigos: {
      eyebrow: 'articles',
      title: 'Articles',
      detailEyebrow: 'article',
      back: '← articles',
      notFound: 'No articles found.',
    },
  },
}
