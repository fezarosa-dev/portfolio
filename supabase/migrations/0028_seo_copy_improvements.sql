-- reescreve o texto de SEO das páginas (title/description) aplicando boas práticas:
-- título 50-60 caracteres com a palavra-chave principal perto do início, descrição
-- 150-160 caracteres com proposta de valor + call-to-action leve, única por página,
-- sem repetição forçada de palavra-chave. Home mantida como está (já seguia essas
-- práticas). upsert porque as linhas já existem desde a migração 0027.
insert into public.site_content (key, value) values
  ('seo_sobre_title', 'Sobre Mim — Experiência em Desenvolvimento Full Stack'),
  ('seo_sobre_title_en', 'About Me — Full Stack Development Experience'),
  ('seo_sobre_description', 'Conheça a trajetória de Felipe Zanoni da Rosa: experiência prática em desenvolvimento full stack, formação técnica e o que me move como engenheiro de software.'),
  ('seo_sobre_description_en', 'Learn about Felipe Zanoni da Rosa''s journey: hands-on full stack development experience, technical background, and what drives me as a software engineer.'),

  ('seo_servicos_title', 'Serviços de Desenvolvimento de Software Sob Medida'),
  ('seo_servicos_title_en', 'Custom Software Development Services'),
  ('seo_servicos_description', 'Serviços de desenvolvimento de software personalizados: aplicações web, automações e soluções full stack para empresas e startups, com Felipe Zanoni da Rosa.'),
  ('seo_servicos_description_en', 'Custom software development services for businesses and startups: web applications, automation and full stack solutions, delivered by Felipe Zanoni da Rosa.'),

  ('seo_projetos_title', 'Projetos de Software — Portfólio Técnico'),
  ('seo_projetos_title_en', 'Software Projects — Technical Portfolio'),
  ('seo_projetos_description', 'Explore projetos reais de software desenvolvidos por Felipe Zanoni da Rosa: código-fonte, tecnologias utilizadas e detalhes técnicos de cada solução.'),
  ('seo_projetos_description_en', 'Explore real-world software projects built by Felipe Zanoni da Rosa — source code, technologies used, and technical details behind each solution.'),

  ('seo_artigos_title', 'Artigos Técnicos sobre Desenvolvimento de Software'),
  ('seo_artigos_title_en', 'Technical Articles on Software Development'),
  ('seo_artigos_description', 'Artigos técnicos escritos por Felipe Zanoni da Rosa sobre desenvolvimento de software, boas práticas de engenharia e tecnologia aplicada no dia a dia.'),
  ('seo_artigos_description_en', 'Technical articles written by Felipe Zanoni da Rosa on software development, engineering best practices, and technology applied in real projects.'),

  ('seo_contato_title', 'Fale Comigo — Contato para Oportunidades'),
  ('seo_contato_title_en', 'Get in Touch — Contact for Opportunities'),
  ('seo_contato_description', 'Entre em contato com Felipe Zanoni da Rosa: e-mail, redes sociais e formulário direto para propostas de trabalho, freelas e colaborações técnicas.'),
  ('seo_contato_description_en', 'Get in touch with Felipe Zanoni da Rosa: email, social links and a direct contact form for job offers, freelance work and technical collaborations.'),

  ('seo_curriculo_title', 'Currículo — Experiência e Formação Técnica'),
  ('seo_curriculo_title_en', 'Resume — Experience and Technical Background'),
  ('seo_curriculo_description', 'Currículo de Felipe Zanoni da Rosa: experiência profissional em desenvolvimento de software, formação acadêmica, habilidades técnicas e certificações.'),
  ('seo_curriculo_description_en', 'Felipe Zanoni da Rosa''s resume: professional experience in software development, academic background, technical skills and certifications.'),

  ('seo_busca_title', 'Busca Inteligente no Portfólio'),
  ('seo_busca_title_en', 'Smart Portfolio Search'),
  ('seo_busca_description', 'Encontre projetos, artigos e tecnologias no portfólio de Felipe Zanoni da Rosa em linguagem natural — a busca entende o significado, não só palavras exatas.'),
  ('seo_busca_description_en', 'Find projects, articles and technologies across Felipe Zanoni da Rosa''s portfolio using natural language — search understands meaning, not just exact words.'),

  ('seo_status_title', 'Bastidores Técnicos — Métricas Reais do Site'),
  ('seo_status_title_en', 'Technical Internals — Live Site Metrics'),
  ('seo_status_description', 'Métricas reais e ao vivo do portfólio de Felipe Zanoni da Rosa: deploy atual, latência do banco de dados e volume de conteúdo, sem nenhum dado simulado.'),
  ('seo_status_description_en', 'Real, live metrics from Felipe Zanoni da Rosa''s portfolio: current deploy, database latency and content volume — nothing simulated, all real data.'),

  ('seo_comoUsar_title', 'Como Usar Este Site — Guia Completo'),
  ('seo_comoUsar_title_en', 'How to Use This Site — Full Guide'),
  ('seo_comoUsar_description', 'Guia completo pelo portfólio de Felipe Zanoni da Rosa: como navegar, usar a busca, explorar projetos e até os easter eggs escondidos pelo site.'),
  ('seo_comoUsar_description_en', 'A complete guide to Felipe Zanoni da Rosa''s portfolio: how to navigate, use search, explore projects, and even the hidden easter eggs on the site.'),

  ('seo_privacidade_title', 'Política de Privacidade'),
  ('seo_privacidade_title_en', 'Privacy Policy'),
  ('seo_privacidade_description', 'Saiba como Felipe Zanoni da Rosa coleta, usa e protege seus dados pessoais neste site: formulário de contato, cookies e seus direitos como usuário.'),
  ('seo_privacidade_description_en', 'Learn how Felipe Zanoni da Rosa''s site collects, uses and protects your personal data: contact form, cookies, and your rights as a visitor.'),

  ('seo_termos_title', 'Termos de Uso'),
  ('seo_termos_title_en', 'Terms of Use'),
  ('seo_termos_description', 'Condições de uso do portfólio de Felipe Zanoni da Rosa: propriedade intelectual, uso aceitável do site e responsabilidades de quem o acessa.'),
  ('seo_termos_description_en', 'Terms of use for Felipe Zanoni da Rosa''s portfolio: intellectual property, acceptable use of the site, and visitor responsibilities.'),

  ('seo_cookies_title', 'Política de Cookies'),
  ('seo_cookies_title_en', 'Cookie Policy'),
  ('seo_cookies_description', 'Quais cookies o portfólio de Felipe Zanoni da Rosa usa, para que servem e como gerenciar suas preferências de privacidade a qualquer momento.'),
  ('seo_cookies_description_en', 'Which cookies Felipe Zanoni da Rosa''s portfolio uses, what they''re for, and how to manage your privacy preferences at any time.')
on conflict (key) do update set value = excluded.value;
