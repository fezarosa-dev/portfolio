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
    status: string
    busca: string
    comoUsar: string
    comoFunciona: string
    privacidade: string
    termos: string
    cookies: string
  }
  errors: {
    notFoundTitle: string
    notFoundText: string
    serverTitle: string
    serverText: string
    retry: string
    home: string
    search: string
    contact: string
  }
  home: {
    whoami: string
    aboutEyebrow: string
    projectsEyebrow: string
    projectsHeading: string
    seeAll: string
    tagline: string
  }
  sobre: { eyebrow: string; title: string }
  servicos: {
    eyebrow: string
    title: string
    lead: string
    hireTitle: string
    hireText: string
    hireResume: string
    hireContact: string
    projectsTitle: string
    ctaTitle: string
    ctaButton: string
  }
  busca: {
    eyebrow: string
    title: string
    subtitle: string
    placeholder: string
    noResults: string
  }
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
    lead: string
    formTitle: string
    categoryLabel: string
    categories: { vaga: string; projeto: string; duvida: string; outro: string }
    subjectLabel: string
    subjectPlaceholder: string
    sendAnother: string
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
  status: {
    eyebrow: string
    title: string
    subtitle: string
    deployLabel: string
    deployLocal: string
    branchLabel: string
    branchLocal: string
    latencyLabel: string
    cacheLabel: string
    reindexLabel: string
    never: string
    runtimeLabel: string
    contentLabel: string
    projects: string
    articles: string
    technologies: string
  }
  comoUsar: { eyebrow: string; title: string }
  comoFunciona: { eyebrow: string; title: string; subtitle: string }
  privacidade: { eyebrow: string; title: string }
  termos: { eyebrow: string; title: string }
  cookiesPage: { eyebrow: string; title: string }
  consent: {
    message: string
    accept: string
    decline: string
    policyLink: string
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
    footer: {
      email: 'e-mail',
      github: 'github',
      linkedin: 'linkedin',
      exportAi: 'exportar p/ IA',
      status: 'status',
      busca: 'busca (⌘K)',
      comoUsar: 'como usar',
      comoFunciona: 'como funciona',
      privacidade: 'privacidade',
      termos: 'termos de uso',
      cookies: 'cookies',
    },
    errors: {
      notFoundTitle: 'Página não encontrada',
      notFoundText: 'Farejei o site inteiro e não achei essa página. Ela pode ter mudado de lugar ou nunca ter existido.',
      serverTitle: 'Algo quebrou por aqui',
      serverText: 'O cachorro dormiu em cima do teclado e deu erro. Tenta de novo; se continuar, me avisa pelo contato.',
      retry: 'Tentar de novo',
      home: 'Voltar pro início',
      search: 'Buscar no site',
      contact: 'Avisar o Felipe',
    },
    home: {
      whoami: '$ whoami',
      aboutEyebrow: 'sobre',
      projectsEyebrow: 'projetos',
      projectsHeading: 'Coisas que construí',
      seeAll: 'ver todos os projetos →',
      tagline: 'Eu resolvo problemas. O código é só a ferramenta.',
    },
    sobre: { eyebrow: 'sobre-mim', title: 'Sobre mim' },
    servicos: {
      eyebrow: 'serviços',
      title: 'Serviços',
      lead: 'Trabalhando com você, em um time ou em projetos sob medida.',
      hireTitle: 'Aberto a oportunidades',
      hireText:
        'Recrutando? Busco oportunidades como engenheiro de software: backend, automação e full stack. Veja meu currículo ou me chame direto.',
      hireResume: 'Ver currículo',
      hireContact: 'Me chamar',
      projectsTitle: 'Projetos sob demanda',
      ctaTitle: 'Tem um projeto em mente?',
      ctaButton: 'Vamos conversar',
    },
    busca: {
      eyebrow: 'busca',
      title: 'Busca',
      subtitle: 'Pergunte com suas próprias palavras — a busca entende o significado, não só o texto exato.',
      placeholder: 'Buscar projetos, artigos, tecnologias…',
      noResults: 'Nada encontrado. Tenta reformular a busca.',
    },
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
      lead: 'Escolha o canal que preferir ou mande uma mensagem pelo formulário — respondo o quanto antes.',
      formTitle: 'Mande uma mensagem',
      categoryLabel: 'Sobre o quê?',
      categories: { vaga: 'Vaga / oportunidade', projeto: 'Projeto / freela', duvida: 'Dúvida', outro: 'Outro' },
      subjectLabel: 'Assunto',
      subjectPlaceholder: 'Ex.: Vaga de desenvolvedor backend',
      sendAnother: 'Enviar outra mensagem',
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
    status: {
      eyebrow: 'internals',
      title: 'Bastidores técnicos',
      subtitle: 'Métricas reais deste site, lidas agora — nada aqui é simulado.',
      deployLabel: 'deploy atual',
      deployLocal: 'ambiente local',
      branchLabel: 'branch / região',
      branchLocal: 'sem info (local)',
      latencyLabel: 'latência do servidor (Vercel)',
      cacheLabel: 'última republicação (cache)',
      reindexLabel: 'última reindexação da busca',
      never: 'nunca',
      runtimeLabel: 'runtime',
      contentLabel: 'conteúdo no banco',
      projects: 'projetos',
      articles: 'artigos',
      technologies: 'tecnologias',
    },
    comoUsar: { eyebrow: 'guia', title: 'Como usar este site' },
    comoFunciona: {
      eyebrow: 'arquitetura',
      title: 'Como este site funciona',
      subtitle: 'Um mapa de como cada peça do projeto se conecta — passe o mouse pra ver os detalhes.',
    },
    privacidade: { eyebrow: 'privacidade', title: 'Política de Privacidade' },
    termos: { eyebrow: 'termos', title: 'Termos de Uso' },
    cookiesPage: { eyebrow: 'cookies', title: 'Política de Cookies' },
    consent: {
      message:
        'Este site usa cookies essenciais (tema, preferências) e, com sua permissão, cookies de análise (Google Analytics) para entender como o site é usado.',
      accept: 'Aceitar',
      decline: 'Recusar',
      policyLink: 'saiba mais',
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
    footer: {
      email: 'email',
      github: 'github',
      linkedin: 'linkedin',
      exportAi: 'export for AI',
      status: 'status',
      busca: 'search (⌘K)',
      comoUsar: 'how to use',
      comoFunciona: 'how it works',
      privacidade: 'privacy',
      termos: 'terms of use',
      cookies: 'cookies',
    },
    errors: {
      notFoundTitle: 'Page not found',
      notFoundText: "I sniffed all over the site and couldn't find this page. It may have moved, or never existed.",
      serverTitle: 'Something broke here',
      serverText: 'The dog fell asleep on the keyboard and caused an error. Try again; if it keeps happening, let me know through the contact page.',
      retry: 'Try again',
      home: 'Back to home',
      search: 'Search the site',
      contact: 'Tell Felipe',
    },
    home: {
      whoami: '$ whoami',
      aboutEyebrow: 'about',
      projectsEyebrow: 'projects',
      projectsHeading: 'Things I built',
      seeAll: 'see all projects →',
      tagline: 'I solve problems. Code is just the tool.',
    },
    sobre: { eyebrow: 'about-me', title: 'About me' },
    servicos: {
      eyebrow: 'services',
      title: 'Services',
      lead: 'Working with you, on a team or on custom projects.',
      hireTitle: 'Open to opportunities',
      hireText:
        "Hiring? I'm looking for software engineering roles: backend, automation and full stack. Check my resume or reach out directly.",
      hireResume: 'View resume',
      hireContact: 'Get in touch',
      projectsTitle: 'Projects on demand',
      ctaTitle: 'Have a project in mind?',
      ctaButton: "Let's talk",
    },
    busca: {
      eyebrow: 'search',
      title: 'Search',
      subtitle: 'Ask in your own words — search understands meaning, not just exact text.',
      placeholder: 'Search projects, articles, technologies…',
      noResults: 'Nothing found. Try rephrasing your search.',
    },
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
      lead: "Pick the channel you prefer or send a message through the form — I'll reply as soon as I can.",
      formTitle: 'Send a message',
      categoryLabel: 'What is it about?',
      categories: { vaga: 'Job / opportunity', projeto: 'Project / freelance', duvida: 'Question', outro: 'Other' },
      subjectLabel: 'Subject',
      subjectPlaceholder: 'E.g.: Backend developer position',
      sendAnother: 'Send another message',
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
    status: {
      eyebrow: 'internals',
      title: 'Technical internals',
      subtitle: 'Real metrics from this site, read right now — nothing here is simulated.',
      deployLabel: 'current deploy',
      deployLocal: 'local environment',
      branchLabel: 'branch / region',
      branchLocal: 'no info (local)',
      latencyLabel: 'server latency (Vercel)',
      cacheLabel: 'last republish (cache)',
      reindexLabel: 'last search reindex',
      never: 'never',
      runtimeLabel: 'runtime',
      contentLabel: 'content in the database',
      projects: 'projects',
      articles: 'articles',
      technologies: 'technologies',
    },
    comoUsar: { eyebrow: 'guide', title: 'How to use this site' },
    comoFunciona: {
      eyebrow: 'architecture',
      title: 'How this site works',
      subtitle: 'A map of how every piece of the project connects — hover for details.',
    },
    privacidade: { eyebrow: 'privacy', title: 'Privacy Policy' },
    termos: { eyebrow: 'terms', title: 'Terms of Use' },
    cookiesPage: { eyebrow: 'cookies', title: 'Cookie Policy' },
    consent: {
      message:
        'This site uses essential cookies (theme, preferences) and, with your permission, analytics cookies (Google Analytics) to understand how the site is used.',
      accept: 'Accept',
      decline: 'Decline',
      policyLink: 'learn more',
    },
  },
}
